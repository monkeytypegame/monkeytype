import { describe, expect, it } from "vitest";
import {
  ConstraintEngine,
  decodeTokenizerVocabulary,
} from "../../../src/ts/test/llm/constraint-engine";

describe("constraint engine", () => {
  it("precomputes valid token transitions for root and mid-word states", () => {
    const engine = new ConstraintEngine(
      ["the", "there", "world"],
      [
        { id: 0, text: "the" },
        { id: 1, text: "there" },
        { id: 2, text: "re" },
        { id: 3, text: " world" },
        { id: 4, text: "w" },
        { id: 5, text: "orld" },
        { id: 6, text: "the world" },
        { id: 7, text: "x" },
        { id: 8, text: "" },
      ],
    );

    expect(engine.getValidTokenIds(engine.rootStateId)).toEqual([0, 1, 4, 6]);

    const theState = engine.getNextState(engine.rootStateId, 0);
    expect(theState).not.toBeNull();
    expect(engine.getStatePrefix(theState as number)).toBe("the");
    expect(engine.canTerminate(theState as number)).toBe(true);
    expect(engine.getValidTokenIds(theState as number)).toEqual([2, 3]);

    const worldFromSpan = engine.getNextState(engine.rootStateId, 6);
    expect(worldFromSpan).not.toBeNull();
    expect(engine.getStatePrefix(worldFromSpan as number)).toBe("world");
    expect(engine.canTerminate(worldFromSpan as number)).toBe(true);

    expect(engine.getNextState(engine.rootStateId, 3)).toBeNull();
    expect(engine.getNextState(engine.rootStateId, 8)).toBeNull();
    expect(engine.canTerminate(engine.rootStateId)).toBe(false);
  });

  it("rejects invalid surface forms in the constructor", () => {
    expect(() => {
      new ConstraintEngine(["hello", "two words"], [{ id: 0, text: "hello" }]);
    }).toThrow("invalid surface form (must not contain spaces)");
  });

  it("decodes tokenizer vocab through the adapter interface", () => {
    const decoded = decodeTokenizerVocabulary({
      getVocabSize() {
        return 3;
      },
      decodeToken(tokenId) {
        return ["a", "b", "c"][tokenId] as string;
      },
    });

    expect(decoded).toEqual([
      { id: 0, text: "a" },
      { id: 1, text: "b" },
      { id: 2, text: "c" },
    ]);
  });

  it("reports basic precompute stats", () => {
    const engine = new ConstraintEngine(
      ["a", "ab"],
      [
        { id: 0, text: "a" },
        { id: 1, text: "b" },
        { id: 2, text: " ab" },
      ],
    );

    expect(engine.getStats().stateCount).toBe(3);
    expect(engine.getStats().tokenCount).toBe(3);
    expect(engine.getStats().averageValidTokensPerState).toBeCloseTo(4 / 3);
  });
});
