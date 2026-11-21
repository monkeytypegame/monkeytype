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
    expect(page.word(0).isActive).toBe(true);
    expect(page.word(1).isActive).toBe(false);
    expect(page.word(1).state).toBe("untyped");
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
      expect(page.word(1).isActive).toBe(true);
    });

    it("marks a mistyped word as an error", async () => {
      const page = await renderTestPage({ words: ["the", "fox", "ran"] });

      await page.type("th ");

      expect(page.word(0).state).toBe("typedIncorrectly");
      expect(page.word(1).isActive).toBe(true);
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

      expect(page.word(0).isActive).toBe(true);
      expect(page.word(1).isActive).toBe(false);
      expect(page.word(1).state).toBe("untyped");
    });

    it("doesn't go back into a correct word", async () => {
      const page = await renderTestPage({ words: ["the", "fox", "ran"] });

      await page.type("the \b");

      expect(page.word(0).state).toBe("typed");
      expect(page.word(1).isActive).toBe(true);
    });

    it("goes back into a correct word in freedom mode", async () => {
      const page = await renderTestPage({
        words: ["the", "fox", "ran"],
        config: { freedomMode: true },
      });

      await page.type("the \b");

      expect(page.word(0).isActive).toBe(true);
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

      expect(page.word(0).isActive).toBe(true);
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

      expect(page.phase()).toBe("finished");
    });

    it("finishes when a timed test runs out", async () => {
      const page = await renderTestPage({ config: { mode: "time", time: 2 } });

      await page.type("a");
      await page.advance(1000);
      expect(page.phase()).toBe("active");

      await page.advance(1000);
      expect(page.phase()).toBe("finished");
    });

    it("shows the result once the words have faded out", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      await page.type("the fox");
      await page.advance(100);
      expect(page.resultScreen()).toEqual({ result: false, spinner: false });

      await page.advance(400);
      expect(page.resultScreen()).toEqual({ result: true, spinner: false });
    });

    it("paints the delayed spinner for a frame before rendering the result", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      await page.type("the fox");
      // the fade-out ends on a frame
      for (let i = 0; i < 20 && !page.resultScreen().spinner; i++) {
        await page.frame();
      }
      expect(page.resultScreen()).toEqual({ result: false, spinner: true });

      await page.frame();
      await page.advance(1);
      expect(page.resultScreen()).toEqual({ result: true, spinner: false });
    });

    it("counts the test as faded out (ads show) from the end of the words' fade-out until a restart swaps the new test in", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      await page.type("the fox");
      // finished, the words still fading out
      expect(page.phase()).toBe("finished");
      expect(page.isTestFadedOut()).toBe(false);

      await page.advance(500);
      expect(page.resultScreen().result).toBe(true);
      expect(page.isTestFadedOut()).toBe(true);

      page.restart();
      // the result fades out first
      expect(page.isTestFadedOut()).toBe(true);
      await page.advance(1000);
      expect(page.phase()).toBe("ready");
      expect(page.isTestFadedOut()).toBe(false);
    });

    it("keeps the spinner until a slow result is built", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });
      page.holdResult();

      await page.type("the fox");
      await page.advance(500);
      expect(page.resultScreen()).toEqual({ result: false, spinner: true });

      page.releaseResult();
      await page.frame();
      expect(page.resultScreen()).toEqual({ result: true, spinner: false });
    });

    it("drops a restart while the result is built", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });
      page.holdResult();

      await page.type("the fox");
      page.restart();
      await page.advance(500);

      expect(page.getRestartCount()).toBe(0);
      page.releaseResult();
      await page.advance(500);
      expect(page.resultScreen().result).toBe(true);
    });

    it("restarts straight to the new test while the words fade out", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      await page.type("the fox");
      // the result is built, the words still fading out
      await page.advance(50);
      page.restart();
      await page.advance(1000);

      expect(page.phase()).toBe("ready");
      expect(page.resultScreen()).toEqual({ result: false, spinner: false });
    });
  });

  describe("restart", () => {
    it("restarts once for test settings changed while the old test fades out", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      page.setConfig("mode", "time");
      expect(page.phase()).toBe("restarting");
      page.setConfig("time", 15);
      await page.frame();
      // the old test fades out as it was
      expect(
        page
          .word(0)
          .letters()
          .map((l) => l.char),
      ).toEqual(["t", "h", "e"]);
      await page.advance(1000);

      expect(page.phase()).toBe("ready");
      expect(page.getRestartCount()).toBe(1);
      expect(page.testSettings().mode).toBe("time");
      expect(page.testSettings().time).toBe(15);
    });

    it("restarts once for a preset changing several test settings", async () => {
      const page = await renderTestPage({ config: { mode: "time", time: 30 } });

      await page.applyConfig({
        mode: "words",
        words: 10,
        punctuation: true,
      });
      await page.advance(1000);

      expect(page.getRestartCount()).toBe(1);
      expect(page.testSettings().mode).toBe("words");
      expect(page.testSettings().words).toBe(10);
      expect(page.testSettings().punctuation).toBe(true);
    });

    it("doesn't restart for a setting that isn't a test setting", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      page.setConfig("blindMode", true);
      await page.advance(500);

      expect(page.getRestartCount()).toBe(0);
    });

    it("drops a second request during a restart", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      page.restart();
      page.restart();
      await page.advance(1000);
      page.restart();
      await page.advance(1000);

      expect(page.getRestartCount()).toBe(2);
      expect(page.phase()).toBe("ready");
    });

    it("restarts once for a second request while the new test fades in", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      page.restart();
      // past the fade-out: the new test is generated
      await page.advance(130);
      page.restart();
      await page.advance(1000);

      expect(page.getRestartCount()).toBe(1);
      expect(page.phase()).toBe("ready");
    });

    it("restarts again for a settings change after the new words are generated", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });

      page.restart();
      await page.advance(130);
      page.setConfig("mode", "time");
      await page.advance(1000);

      expect(page.testSettings().mode).toBe("time");
      expect(page.phase()).toBe("ready");
    });

    it("keeps the result on screen until it has faded out", async () => {
      const page = await renderTestPage({ words: ["the", "fox"] });
      await page.type("the fox");
      await page.advance(500);
      expect(page.phase()).toBe("finished");

      page.restart();

      expect(page.phase()).not.toBe("finished");
      expect(page.resultScreen().result).toBe(true);
      await page.advance(1000);
      expect(page.phase()).toBe("ready");
      expect(page.resultScreen().result).toBe(false);
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
