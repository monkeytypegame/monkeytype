import { describe, expect, it } from "vitest";
import { ConstraintEngine } from "../../../src/ts/test/llm/constraint-engine";
import {
  OracleState,
  createConstraintOracle,
} from "../../../src/ts/test/llm/spec-oracle";

type DecodedToken = {
  id: number;
  text: string;
};

describe("constraint engine oracle", () => {
  it("models the spec with a simple oracle", () => {
    const oracle = createConstraintOracle(["the", "there", "world"]);

    const theState = oracle.getNextState(oracle.initialState, "the");
    expect(theState).toEqual({ partialWord: "the" });
    expect(oracle.canTerminate(theState as OracleState)).toBe(true);

    const worldState = oracle.getNextState(theState as OracleState, " world");
    expect(worldState).toEqual({ partialWord: "world" });
    expect(oracle.canTerminate(worldState as OracleState)).toBe(true);

    expect(oracle.getNextState(oracle.initialState, " world")).toBeNull();
    expect(oracle.getNextState(theState as OracleState, "x")).toBeNull();
    expect(oracle.getNextState(theState as OracleState, "  ")).toBeNull();
  });

  it("matches the oracle on curated prefix-heavy cases", () => {
    const tokenTexts = enumerateTokenTexts(["a", "b", "c", " "], 3);

    for (const words of [
      ["a", "ab", "aba", "b", "ba"],
      ["the", "there", "world"],
      ["cat", "car", "card", "dog"],
      ["go", "good", "goods", "gone"],
    ]) {
      assertEngineMatchesOracle(words, tokenTexts);
    }
  });

  it("matches the oracle across randomized small wordsets", () => {
    const rng = createMulberry32(123456);
    const tokenTexts = enumerateTokenTexts(["a", "b", "c", " "], 3);
    const availableWords = enumerateTokenTexts(["a", "b", "c"], 4).filter(
      (word) => word.length > 0,
    );

    for (let index = 0; index < 75; index++) {
      const wordCount = 2 + Math.floor(rng() * 6);
      const words = pickUniqueWords(availableWords, wordCount, rng);
      assertEngineMatchesOracle(words, tokenTexts);
    }
  });

  it("stays inside the language during random valid walks", () => {
    const rng = createMulberry32(98765);
    const words = ["a", "ab", "abc", "b", "ba"];
    const decodedTokens = buildDecodedTokens(
      enumerateTokenTexts(["a", "b", "c", " "], 3),
    );
    const engine = new ConstraintEngine(words, decodedTokens);
    const oracle = createConstraintOracle(words);

    for (let walk = 0; walk < 100; walk++) {
      let stateId = engine.rootStateId;
      let oracleState = oracle.initialState;
      let renderedText = "";

      for (let step = 0; step < 20; step++) {
        const validTokenIds = engine.getValidTokenIds(stateId);
        expect(validTokenIds.length).toBeGreaterThan(0);

        const tokenId = validTokenIds[
          Math.floor(rng() * validTokenIds.length)
        ] as number;
        const tokenText = decodedTokens[tokenId]?.text ?? "";
        const nextStateId = engine.getNextState(stateId, tokenId);
        const nextOracleState = oracle.getNextState(oracleState, tokenText);

        expect(nextStateId).not.toBeNull();
        expect(nextOracleState).not.toBeNull();

        renderedText += tokenText;
        stateId = nextStateId as number;
        oracleState = nextOracleState as OracleState;

        expect(engine.getStatePrefix(stateId)).toBe(oracleState.partialWord);

        const parsedWords = renderedText
          .split(" ")
          .filter(
            (word, index, items) => word.length > 0 && index < items.length - 1,
          );

        for (const word of parsedWords) {
          expect(words).toContain(word);
        }

        if (engine.canTerminate(stateId) && step > 0 && rng() < 0.35) {
          break;
        }
      }
    }
  });
});

function assertEngineMatchesOracle(
  words: string[],
  tokenTexts: string[],
): void {
  const decodedTokens = buildDecodedTokens(tokenTexts);
  const engine = new ConstraintEngine(words, decodedTokens);
  const oracle = createConstraintOracle(words);

  for (let stateId = 0; stateId < engine.getStateCount(); stateId++) {
    const oracleState = {
      partialWord: engine.getStatePrefix(stateId),
    };

    expect(engine.canTerminate(stateId)).toBe(oracle.canTerminate(oracleState));

    const expectedValidTokenIds: number[] = [];

    for (const token of decodedTokens) {
      const nextOracleState = oracle.getNextState(oracleState, token.text);
      const nextEngineStateId = engine.getNextState(stateId, token.id);

      if (nextOracleState === null) {
        expect(nextEngineStateId).toBeNull();
        continue;
      }

      expectedValidTokenIds.push(token.id);
      expect(nextEngineStateId).not.toBeNull();
      expect(engine.getStatePrefix(nextEngineStateId as number)).toBe(
        nextOracleState.partialWord,
      );
    }

    expect(engine.getValidTokenIds(stateId)).toEqual(expectedValidTokenIds);
  }
}

function buildDecodedTokens(tokenTexts: string[]): DecodedToken[] {
  return tokenTexts.map((text, id) => ({ id, text }));
}

function enumerateTokenTexts(alphabet: string[], maxLength: number): string[] {
  const texts = [""];

  for (let length = 1; length <= maxLength; length++) {
    buildTextsOfLength("", length, alphabet, texts);
  }

  return texts;
}

function buildTextsOfLength(
  prefix: string,
  remainingLength: number,
  alphabet: string[],
  texts: string[],
): void {
  if (remainingLength === 0) {
    texts.push(prefix);
    return;
  }

  for (const char of alphabet) {
    buildTextsOfLength(
      `${prefix}${char}`,
      remainingLength - 1,
      alphabet,
      texts,
    );
  }
}

function createMulberry32(seed: number): () => number {
  let current = seed;

  return () => {
    current |= 0;
    current = (current + 0x6d2b79f5) | 0;
    let t = Math.imul(current ^ (current >>> 15), 1 | current);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickUniqueWords(
  availableWords: string[],
  count: number,
  rng: () => number,
): string[] {
  const pool = [...availableWords];
  const result: string[] = [];

  for (let index = 0; index < count; index++) {
    const pickIndex = Math.floor(rng() * pool.length);
    const [word] = pool.splice(pickIndex, 1);

    if (word !== undefined) {
      result.push(word);
    }
  }

  return result;
}
