import { describe, expect, it } from "vitest";
import { ConstraintTrie } from "../../../src/ts/test/llm/constraint-trie";

describe("constraint trie", () => {
  it("supports words that are prefixes of longer words", () => {
    const trie = new ConstraintTrie(["the", "there", "world"]);

    const tState = trie.consumeChar(trie.rootStateId, "t");
    expect(tState).not.toBeNull();

    const thState = trie.consumeChar(tState as number, "h");
    expect(thState).not.toBeNull();

    const theState = trie.consumeChar(thState as number, "e");
    expect(theState).not.toBeNull();
    expect(trie.getPrefix(theState as number)).toBe("the");
    expect(trie.isWordState(theState as number)).toBe(true);

    expect(trie.consumeChar(theState as number, " ")).toBe(trie.rootStateId);

    const therState = trie.consumeChar(theState as number, "r");
    expect(therState).not.toBeNull();
    expect(trie.getPrefix(therState as number)).toBe("ther");

    expect(trie.consumeChar(theState as number, "x")).toBeNull();
  });

  it("consumes multi-word token text across boundaries", () => {
    const trie = new ConstraintTrie(["hello", "world"]);

    const nextState = trie.consumeText(trie.rootStateId, "hello world");

    expect(nextState).not.toBeNull();
    expect(trie.getPrefix(nextState as number)).toBe("world");
    expect(trie.isWordState(nextState as number)).toBe(true);
  });
});
