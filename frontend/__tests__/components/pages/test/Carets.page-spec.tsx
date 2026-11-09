import { afterEach, describe, expect, it } from "vitest";

import { getInputElement } from "../../../../src/ts/input/input-element";
import {
  cleanupTestPage,
  renderTestPage,
} from "../../../__harness__/test-page";

afterEach(async () => cleanupTestPage());

describe("caret", () => {
  it("shows on a ready test", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    expect(page.caret().shown).toBe(true);
  });

  it("hides while the words input is out of focus", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    getInputElement().blur();
    expect(page.caret().shown).toBe(false);

    getInputElement().focus();
    expect(page.caret().shown).toBe(true);
  });

  it("hides as soon as the test finishes", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    // the last word ends the test (any mode, eg. time up): hidden before the
    // fade out ends
    await page.type("the fox", { flush: false });

    expect(page.phase()).not.toBe("finished");
    expect(page.caret().shown).toBe(false);
  });
});

describe("pace caret", () => {
  // 60 wpm: a letter every 200ms
  const config = { paceCaret: "custom", paceCaretCustomSpeed: 60 } as const;

  it("is hidden until the test starts", async () => {
    const page = await renderTestPage({ words: ["the", "fox"], config });

    expect(page.paceCaret()).toEqual({ shown: false });
  });

  it("heads one letter further each step once the test starts", async () => {
    const page = await renderTestPage({ words: ["the", "fox"], config });

    await page.type("t");
    expect(page.paceCaret()).toEqual({
      shown: true,
      target: { wordIndex: 0, letterIndex: 1 },
    });

    await page.advance(200);
    expect(page.paceCaret().target).toEqual({ wordIndex: 0, letterIndex: 2 });

    // past the word's letters and the space after it, on to the next word
    await page.advance(400);
    expect(page.paceCaret().target).toEqual({ wordIndex: 1, letterIndex: 0 });
  });

  it("stays hidden with pace caret off", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    await page.type("t");
    await page.advance(400);

    expect(page.paceCaret()).toEqual({ shown: false });
  });
});
