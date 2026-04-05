import { randomElementFromArray } from "../../utils/arrays";
import { Wordset, type FunboxWordsFrequency } from "../wordset";
import { buildSurfaceForms } from "./surface-forms";
import { ConstraintEngine } from "./constraint-engine";
import { acquireWebGptRuntime, releaseWebGptRuntime } from "./webgpt-runtime";
import type { LlmTokenTiming, RuntimeDevice } from "./types";

type WordUpdate = {
  pendingText: string;
  pendingWordStartedInCurrentToken: boolean;
};

type WebGptWordGeneratorConfig = {
  contextWindowSize: number;
  initialWords: number;
  bufferMinWords: number;
  bufferTargetWords: number;
  maxTokensPerFill: number;
  temperature: number;
  topK: number;
  onTokenTiming?: (timing: LlmTokenTiming) => void;
};

const DEFAULT_CONFIG: WebGptWordGeneratorConfig = {
  contextWindowSize: 5,
  initialWords: 1,
  bufferMinWords: 10,
  bufferTargetWords: 100,
  maxTokensPerFill: 128,
  temperature: 1,
  topK: 8,
};

export class WebGptWordGenerator extends Wordset {
  private readonly config: WebGptWordGeneratorConfig;
  private readonly initPromise: Promise<void>;
  private readonly wordBuffer: string[] = [];

  private engine: ConstraintEngine | null = null;
  private runtime: Awaited<ReturnType<typeof acquireWebGptRuntime>> | null =
    null;
  private tokenizer:
    | Awaited<ReturnType<typeof acquireWebGptRuntime>>["tokenizer"]
    | null = null;
  private decodedTokens: Awaited<
    ReturnType<typeof acquireWebGptRuntime>
  >["decodedTokens"] = [];
  private maxContextWindowSize = 16;
  private currentStateId: number | null = null;
  private allTokenIds: number[] = [];
  private currentWordStartTokenIndex = 0;
  private pendingText = "";
  private requireBoundaryOnNextToken = false;
  private generationPromise: Promise<void> | null = null;
  private requestedBufferSize = 0;
  private disposed = false;
  private initError: Error | null = null;
  private bufferWaiters: Array<() => void> = [];
  private runtimeDevice: RuntimeDevice | null = null;
  private generatedTokenCount = 0;

  constructor(
    words: string[],
    config: Partial<WebGptWordGeneratorConfig> = {},
  ) {
    const surfaceForms = buildSurfaceForms(words);

    if (surfaceForms.length === 0) {
      throw new Error(
        "WebGPT word generator requires at least one usable surface form",
      );
    }

    super(surfaceForms);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initPromise = this.init(surfaceForms);
  }

  // mode (normal/zipf) is ignored — the LLM's own probability distribution
  // determines word order, not uniform or zipf sampling from the wordset
  override async randomWordAsync(_mode: FunboxWordsFrequency): Promise<string> {
    if (this.disposed) {
      throw new Error("WebGPT word generator was disposed");
    }

    await this.ensureMinBuffer(1);
    return this.randomWord("normal");
  }

  override randomWord(_mode: FunboxWordsFrequency): string {
    if (this.disposed) {
      throw new Error("WebGPT word generator was disposed");
    }

    const word = this.wordBuffer.shift();

    if (word === undefined) {
      throw this.initError ?? new Error("WebGPT word buffer is empty");
    }

    if (this.wordBuffer.length < this.config.bufferMinWords) {
      void this.ensureMinBuffer(this.config.bufferTargetWords);
    }

    return word;
  }

  override getInitialWordCount(): number | null {
    return this.config.initialWords;
  }

  override getStreamingBufferTarget(): number | null {
    return this.config.bufferTargetWords;
  }

  // the constraint engine already guarantees only wordset words are generated,
  // so monkeytype's rejection loop (dedup, punctuation, numbers) is redundant
  // and would waste LLM forward passes on re-rolls
  override skipsWordRejection(): boolean {
    return true;
  }

  getRuntimeDevice(): RuntimeDevice | null {
    return this.runtimeDevice;
  }

  getStateCount(): number {
    return this.engine?.getStateCount() ?? 0;
  }

  getMaterializedStateCount(): number {
    return (
      this.engine
        ?.getStateProfiles()
        .filter((stateProfile) => stateProfile.materialized).length ?? 0
    );
  }

  override async dispose(): Promise<void> {
    if (this.runtime !== null) {
      releaseWebGptRuntime(this.runtime);
    }

    this.disposed = true;
    this.wordBuffer.length = 0;
    this.pendingText = "";
    this.generationPromise = null;
    this.requestedBufferSize = 0;
    this.runtime = null;
    this.notifyBufferWaiters();
  }

  async waitForReady(): Promise<void> {
    await this.initPromise;
  }

  async ensureMinBuffer(minWords: number): Promise<void> {
    await this.waitForReady();

    if (this.disposed) {
      return;
    }

    this.requestedBufferSize = Math.max(this.requestedBufferSize, minWords);

    if (this.wordBuffer.length >= this.requestedBufferSize) {
      return;
    }

    this.generationPromise ??= this.fillBuffer();

    while (!this.disposed && this.wordBuffer.length < minWords) {
      const generationPromise = this.generationPromise;

      if (generationPromise === null) {
        this.generationPromise = this.fillBuffer();
        continue;
      }

      await Promise.race([generationPromise, this.waitForBufferChange()]);
    }
  }

  private async init(surfaceForms: string[]): Promise<void> {
    try {
      const runtime = await acquireWebGptRuntime();

      if (this.disposed) {
        releaseWebGptRuntime(runtime);
        return;
      }

      this.runtime = runtime;
      this.tokenizer = runtime.tokenizer;
      this.decodedTokens = runtime.decodedTokens;
      this.maxContextWindowSize = runtime.maxContextWindowSize;
      this.runtimeDevice = runtime.device;
      this.engine = new ConstraintEngine(surfaceForms, this.decodedTokens);

      const seedWord = randomElementFromArray(surfaceForms);
      const promptText = seedWord;
      const currentStateId = this.engine.consumeText(
        this.engine.rootStateId,
        promptText,
      );

      if (currentStateId === null) {
        throw new Error(
          `Failed to seed WebGPT prompt with ${JSON.stringify(promptText)}`,
        );
      }

      this.currentStateId = currentStateId;
      this.allTokenIds = this.tokenizer.encode(promptText);
      this.currentWordStartTokenIndex = this.allTokenIds.length;
      // show the seed word immediately, but force the first sampled token to begin
      // with a space so the visible seed cannot be extended into another word.
      this.wordBuffer.push(seedWord);
      this.requireBoundaryOnNextToken = true;
    } catch (error) {
      this.initError =
        error instanceof Error ? error : new Error(String(error));
      throw this.initError;
    }
  }

  private async fillBuffer(): Promise<void> {
    try {
      while (
        !this.disposed &&
        this.wordBuffer.length < this.requestedBufferSize
      ) {
        await this.generateTokensUntilWords(this.requestedBufferSize);
      }
    } finally {
      this.requestedBufferSize = 0;
      this.generationPromise = null;
      this.notifyBufferWaiters();
    }
  }

  // Runs the core token-by-token generation loop. Each iteration:
  //   1. Builds a bounded context window from recent token IDs
  //   2. Runs a forward pass through the WebGPT model to get logits
  //   3. Masks logits to only tokens valid in the current constraint state
  //      (if this is the first token after the seed word, further restricts
  //       to tokens starting with a space so the seed can't be extended)
  //   4. Samples one token using top-k + temperature
  //   5. Advances the constraint state and appends the token text
  //   6. Splits completed words off the pending text into the word buffer
  //
  // Stops when the buffer reaches targetBufferSize, the generator is disposed,
  // or maxTokensPerFill tokens have been generated (yields back to fillBuffer
  // which re-enters if more words are still needed).
  private async generateTokensUntilWords(
    targetBufferSize: number,
  ): Promise<void> {
    const engine = this.engine;
    const runtime = this.runtime;

    if (engine === null || this.tokenizer === null || runtime === null) {
      throw this.initError ?? new Error("WebGPT generator is not ready");
    }

    for (
      let tokenStep = 0;
      tokenStep < this.config.maxTokensPerFill;
      tokenStep++
    ) {
      if (this.wordBuffer.length >= targetBufferSize || this.disposed) {
        return;
      }

      if (this.currentStateId === null) {
        throw new Error("Current WebGPT state is null");
      }

      const contextWindowSize = Math.min(
        this.config.contextWindowSize,
        this.maxContextWindowSize,
      );
      const contextTokenIds = sliceContextTokenIds(
        this.allTokenIds,
        contextWindowSize,
        this.currentWordStartTokenIndex,
        this.pendingText.length > 0,
      );
      const modelStart = performance.now();
      const logits = await runtime.forward(contextTokenIds);
      const modelMs = performance.now() - modelStart;

      if (this.disposed) {
        return;
      }

      const constraintStart = performance.now();
      const validTokenIds = engine.getValidTokenIds(this.currentStateId);
      const eligibleTokenIds = this.requireBoundaryOnNextToken
        ? validTokenIds.filter((tokenId) => {
            // the first sampled token must cross a word boundary because the seed word
            // is already visible in the UI.
            return (this.decodedTokens[tokenId]?.text ?? "").startsWith(" ");
          })
        : validTokenIds;

      if (eligibleTokenIds.length === 0) {
        throw new Error(
          `No boundary-respecting WebGPT tokens available from state ${this.currentStateId}`,
        );
      }

      const candidates = eligibleTokenIds.map((tokenId) => ({
        tokenId,
        score: logits[tokenId] ?? -Infinity,
      }));
      const constraintMs = performance.now() - constraintStart;
      const sampleStart = performance.now();
      const nextTokenId = sampleToken(
        candidates,
        this.config.topK,
        this.config.temperature,
      );
      const sampleMs = performance.now() - sampleStart;

      if (nextTokenId === null) {
        throw new Error(
          `Failed to sample WebGPT token from state ${this.currentStateId}`,
        );
      }

      const nextStateId = engine.getNextState(this.currentStateId, nextTokenId);

      if (nextStateId === null) {
        throw new Error(
          `Sampled invalid WebGPT token ${nextTokenId} from state ${this.currentStateId}`,
        );
      }

      if (this.disposed) {
        return;
      }

      this.currentStateId = nextStateId;
      this.allTokenIds.push(nextTokenId);
      this.generatedTokenCount++;
      this.requireBoundaryOnNextToken = false;
      const tokenText = this.decodedTokens[nextTokenId]?.text ?? "";
      const update = consumeTokenTextIntoWords(
        this.pendingText,
        tokenText,
        this.wordBuffer,
      );

      if (this.wordBuffer.length > 0) {
        this.notifyBufferWaiters();
      }

      this.pendingText = update.pendingText;
      this.currentWordStartTokenIndex = getNextCurrentWordStartTokenIndex(
        this.allTokenIds.length,
        this.currentWordStartTokenIndex,
        this.pendingText,
        update.pendingWordStartedInCurrentToken,
      );
      this.config.onTokenTiming?.({
        tokenIndex: this.generatedTokenCount,
        stateId: this.currentStateId,
        contextLength: contextTokenIds.length,
        validTokenCount: validTokenIds.length,
        bufferSize: this.wordBuffer.length,
        forwardMs: modelMs,
        constraintMs,
        sampleMs,
        totalMs: modelMs + constraintMs + sampleMs,
      });
    }
  }

  private async waitForBufferChange(): Promise<void> {
    return new Promise((resolve) => {
      this.bufferWaiters.push(resolve);
    });
  }

  private notifyBufferWaiters(): void {
    const waiters = this.bufferWaiters;
    this.bufferWaiters = [];

    for (const waiter of waiters) {
      waiter();
    }
  }
}

function consumeTokenTextIntoWords(
  pendingText: string,
  tokenText: string,
  wordBuffer: string[],
): WordUpdate {
  const combinedText = `${pendingText}${tokenText}`;
  const parts = combinedText.split(" ");
  const nextPendingText = parts.pop() ?? "";
  const pendingWordStartedInCurrentToken =
    nextPendingText.length > 0 &&
    (pendingText.length === 0 || tokenText.includes(" "));

  for (const word of parts) {
    if (word.length > 0) {
      wordBuffer.push(word);
    }
  }

  return {
    pendingText: nextPendingText,
    pendingWordStartedInCurrentToken,
  };
}

function sliceContextTokenIds(
  allTokenIds: number[],
  contextWindowSize: number,
  currentWordStartTokenIndex: number,
  hasPendingWord: boolean,
): number[] {
  let contextStartIndex = Math.max(0, allTokenIds.length - contextWindowSize);

  if (hasPendingWord && currentWordStartTokenIndex < allTokenIds.length) {
    contextStartIndex = Math.min(contextStartIndex, currentWordStartTokenIndex);
  }

  return allTokenIds.slice(contextStartIndex);
}

function getNextCurrentWordStartTokenIndex(
  totalTokenCount: number,
  currentWordStartTokenIndex: number,
  pendingText: string,
  pendingWordStartedInCurrentToken: boolean,
): number {
  if (pendingText.length === 0) {
    return totalTokenCount;
  }

  if (pendingWordStartedInCurrentToken) {
    return totalTokenCount - 1;
  }

  return currentWordStartTokenIndex;
}

function sampleToken(
  candidates: Array<{ tokenId: number; score: number }>,
  topK: number,
  temperature: number,
): number | null {
  const filteredCandidates = candidates
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.min(topK, candidates.length));

  if (filteredCandidates.length === 0) {
    return null;
  }

  const scaledScores = filteredCandidates.map((candidate) => {
    return candidate.score / temperature;
  });
  const maxScore = Math.max(...scaledScores);
  const expScores = scaledScores.map((score) => Math.exp(score - maxScore));
  const total = expScores.reduce((sum, value) => sum + value, 0);
  let sample = Math.random();

  for (let index = 0; index < filteredCandidates.length; index++) {
    sample -= (expScores[index] ?? 0) / total;

    if (sample <= 0) {
      return filteredCandidates[index]?.tokenId ?? null;
    }
  }

  return filteredCandidates.at(-1)?.tokenId ?? null;
}
