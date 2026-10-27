import { afterEach, describe, expect, it } from "vitest";

import {
  cleanupTestPage,
  renderTestPage,
} from "../../../__harness__/test-page";

afterEach(async () => cleanupTestPage());

describe("TestPage", () => {
  it("mounts a ready test showing the words", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    expect(page.phase()).toBe("ready");
    expect(page.word(0).state).toBe("active");
    expect(page.word(1).state).toBe("upcoming");
    expect(page.word(1).letters()).toEqual([
      { char: "f", state: "untyped" },
      { char: "o", state: "untyped" },
      { char: "x", state: "untyped" },
    ]);
  });

  it("starts the test on the first letter", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    await page.type("t");

    expect(page.phase()).toBe("active");
  });

  it("marks correct and incorrect letters", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    await page.type("tx");

    expect(page.word(0).letters()).toEqual([
      { char: "t", state: "correct" },
      { char: "h", state: "incorrect" },
      { char: "e", state: "untyped" },
    ]);
  });

  it("adds extra letters past the end of the word", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    await page.type("thee");

    expect(page.word(0).letters()).toEqual([
      { char: "t", state: "correct" },
      { char: "h", state: "correct" },
      { char: "e", state: "correct" },
      { char: "e", state: "extra" },
    ]);
  });

  it("renders input on the next frame, not synchronously", async () => {
    const page = await renderTestPage({ words: ["the", "fox"] });

    await page.type("t", { flush: false });
    expect(page.word(0).letters()[0]).toEqual({ char: "t", state: "untyped" });

    await page.frame();
    expect(page.word(0).letters()[0]).toEqual({ char: "t", state: "correct" });
  });

  describe("space", () => {
    it("moves to the next word", async () => {
      const page = await renderTestPage({ words: ["the", "fox", "ran"] });

      await page.type("the ");

      expect(page.word(0).state).toBe("typed");
      expect(page.word(1).state).toBe("active");
    });

    it("marks a mistyped word as an error", async () => {
      const page = await renderTestPage({ words: ["the", "fox", "ran"] });

      await page.type("th ");

      expect(page.word(0).state).toBe("error");
      expect(page.word(1).state).toBe("active");
    });
  });

  describe("backspace", () => {
    it("deletes the last letter", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      await page.type("tx\b");

      expect(page.word(0).letters()).toEqual([
        { char: "t", state: "correct" },
        { char: "h", state: "untyped" },
        { char: "e", state: "untyped" },
      ]);
    });

    it("goes back into a mistyped word", async () => {
      const page = await renderTestPage({ words: ["the", "fox", "ran"] });

      await page.type("th \b");

      expect(page.word(0).state).toBe("active");
      expect(page.word(1).state).toBe("upcoming");
    });

    it("doesn't go back into a correct word", async () => {
      const page = await renderTestPage({ words: ["the", "fox", "ran"] });

      await page.type("the \b");

      expect(page.word(0).state).toBe("typed");
      expect(page.word(1).state).toBe("active");
    });

    it("goes back into a correct word in freedom mode", async () => {
      const page = await renderTestPage({
        words: ["the", "fox", "ran"],
        config: { freedomMode: true },
      });

      await page.type("the \b");

      expect(page.word(0).state).toBe("active");
    });
  });

  describe("word delete", () => {
    it("clears the word it leaves when it also deletes a strict space", async () => {
      const page = await renderTestPage({
        words: ["the", "fox", "ran"],
        config: { strictSpace: true },
      });

      await page.type("th  ");
      expect(page.word(1).letters()[0]?.state).toBe("incorrect");

      await page.deleteWord();

      expect(page.word(0).state).toBe("active");
      expect(page.word(1).letters()).toEqual([
        { char: "f", state: "untyped" },
        { char: "o", state: "untyped" },
        { char: "x", state: "untyped" },
      ]);
    });
  });

  describe("read ahead funbox", () => {
    it("shows the words again after a backspace over a wrong letter", async () => {
      const page = await renderTestPage({
        words: ["the", "fox"],
        config: { funbox: ["read_ahead"] },
      });
      const words = document.querySelector("#words");

      await page.type("tx");
      expect(words?.classList).not.toContain("read_ahead_disabled");

      await page.type("\b");
      expect(words?.classList).toContain("read_ahead_disabled");

      await page.type("h ");
      expect(words?.classList).not.toContain("read_ahead_disabled");
    });

    it("keeps the words hidden on a backspace in an empty word after a correct one", async () => {
      const page = await renderTestPage({
        words: ["the", "fox"],
        config: { funbox: ["read_ahead"] },
      });

      await page.type("the \b");

      expect(document.querySelector("#words")?.classList).not.toContain(
        "read_ahead_disabled",
      );
    });
  });

  it("stops on a wrong letter with stop on error", async () => {
    const page = await renderTestPage({
      words: ["the", "fox"],
      config: { stopOnError: "letter" },
    });

    await page.type("txh");

    expect(page.word(0).letters()).toEqual([
      { char: "t", state: "correct" },
      { char: "h", state: "correct" },
      { char: "e", state: "untyped" },
    ]);
  });

  it("commits an IME composition", async () => {
    const page = await renderTestPage({ words: ["かな", "き"] });

    await page.compose(["k", "か"]);

    expect(page.phase()).toBe("active");
    expect(page.word(0).letters()).toEqual([
      { char: "か", state: "correct" },
      { char: "な", state: "untyped" },
    ]);
  });

  it("ticks live stats every second", async () => {
    const page = await renderTestPage({ words: ["the", "fox", "ran"] });

    await page.type("the ");
    expect(page.liveStats().seconds).toBe(0);

    await page.advance(1000);

    expect(page.liveStats().seconds).toBe(1);
    expect(page.liveStats().wpm).toBeGreaterThan(0);
    expect(page.liveStats().acc).toBe(100);
  });

  describe("finish", () => {
    it("finishes on the last letter of a words test", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      await page.type("the fox");
      // the test fades out before it counts as finished
      await page.advance(500);

      expect(page.phase()).toBe("finished");
    });

    it("finishes when a timed test runs out", async () => {
      const page = await renderTestPage({ config: { mode: "time", time: 2 } });

      await page.type("a");
      await page.advance(1000);
      expect(page.phase()).toBe("active");

      await page.advance(1000);
      // the test fades out before it counts as finished
      await page.advance(500);
      expect(page.phase()).toBe("finished");
    });
  });

  it("starts each spec on a fresh test", async () => {
    // the previous specs left typed, finished tests behind
    const page = await renderTestPage({ words: ["the", "fox"] });

    expect(page.phase()).toBe("ready");
    expect(page.liveStats()).toEqual({
      wpm: undefined,
      raw: undefined,
      acc: undefined,
      seconds: undefined,
    });
    expect(
      page
        .word(0)
        .letters()
        .map((l) => l.state),
    ).toEqual(["untyped", "untyped", "untyped"]);
  });
});
