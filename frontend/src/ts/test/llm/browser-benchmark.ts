import type { LlmTokenTiming, RuntimeDevice } from "./types";
import { clearWebGptRuntimeCache, loadWebGptRuntime } from "./webgpt-runtime";
import { WebGptWordGenerator } from "./webgpt-word-generator";

export type BrowserLlmBenchmarkOptions = {
  languageFile?: string;
  wordsToConsume?: number;
  contextWindowSize?: number;
  clearRuntimeCache?: boolean;
};

type MemorySnapshot = {
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  uaBytes?: number;
  uaBreakdown?: Array<{ bytes: number; types: string[] }>;
};

type ResourceSnapshot = {
  name: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
};

export type BrowserLlmBenchmarkResult = {
  modelId: string;
  languageFile: string;
  wordsToConsume: number;
  contextWindowSize: number;
  runtimeDevice: RuntimeDevice | null;
  runtimeLoadMs: number;
  generatorReadyMs: number;
  firstWordMs: number;
  totalWordConsumptionMs: number;
  wordsPerSecond: number;
  wordLatenciesMs: number[];
  tokenTimings: LlmTokenTiming[];
  tokenTimingSummary: {
    avgTotalMs: number;
    p95TotalMs: number;
    avgForwardMs: number;
    avgConstraintMs: number;
    avgSampleMs: number;
  };
  stateSummary: {
    stateCount: number;
    materializedStateCount: number;
  };
  memoryBefore: MemorySnapshot;
  memoryAfter: MemorySnapshot;
  resources: ResourceSnapshot[];
  words: string[];
};

export async function runLlmBrowserBenchmark(
  options: BrowserLlmBenchmarkOptions = {},
): Promise<BrowserLlmBenchmarkResult> {
  const languageFile = options.languageFile ?? "english_5k.json";
  const wordsToConsume = options.wordsToConsume ?? 100;
  const contextWindowSize = options.contextWindowSize ?? 5;

  if (options.clearRuntimeCache) {
    clearWebGptRuntimeCache();
  }

  const resourceStartTime = performance.now();
  const memoryBefore = await captureMemorySnapshot();

  const runtimeStart = performance.now();
  const loadedRuntime = await loadWebGptRuntime();
  const runtimeLoadMs = performance.now() - runtimeStart;

  const words = await loadLanguageWords(languageFile);
  const tokenTimings: LlmTokenTiming[] = [];
  const generatorReadyStart = performance.now();
  const generator = new WebGptWordGenerator(words, {
    contextWindowSize,
    onTokenTiming(timing) {
      tokenTimings.push(timing);
    },
  });

  await generator.waitForReady();
  await generator.ensureMinBuffer(generator.getInitialWordCount() ?? 1);
  const generatorReadyMs = performance.now() - generatorReadyStart;

  const consumedWords: string[] = [];
  const wordLatenciesMs: number[] = [];
  const firstWordStart = performance.now();

  for (let index = 0; index < wordsToConsume; index++) {
    const wordStart = performance.now();
    const word = await generator.randomWordAsync("normal");
    const wordLatencyMs = performance.now() - wordStart;

    if (index === 0) {
      wordLatenciesMs.push(performance.now() - firstWordStart);
    } else {
      wordLatenciesMs.push(wordLatencyMs);
    }

    consumedWords.push(word);
  }

  const totalWordConsumptionMs = wordLatenciesMs.reduce(
    (sum, value) => sum + value,
    0,
  );
  const memoryAfter = await captureMemorySnapshot();
  const resources = collectResourceSnapshots(resourceStartTime);

  const result: BrowserLlmBenchmarkResult = {
    modelId: loadedRuntime.modelId,
    languageFile,
    wordsToConsume,
    contextWindowSize,
    runtimeDevice: generator.getRuntimeDevice() ?? loadedRuntime.device,
    runtimeLoadMs,
    generatorReadyMs,
    firstWordMs: wordLatenciesMs[0] ?? 0,
    totalWordConsumptionMs,
    wordsPerSecond:
      totalWordConsumptionMs === 0
        ? 0
        : (wordsToConsume / totalWordConsumptionMs) * 1000,
    wordLatenciesMs,
    tokenTimings,
    tokenTimingSummary: {
      avgTotalMs: average(tokenTimings.map((timing) => timing.totalMs)),
      p95TotalMs: percentile(
        tokenTimings.map((timing) => timing.totalMs),
        0.95,
      ),
      avgForwardMs: average(tokenTimings.map((timing) => timing.forwardMs)),
      avgConstraintMs: average(
        tokenTimings.map((timing) => timing.constraintMs),
      ),
      avgSampleMs: average(tokenTimings.map((timing) => timing.sampleMs)),
    },
    stateSummary: {
      stateCount: generator.getStateCount(),
      materializedStateCount: generator.getMaterializedStateCount(),
    },
    memoryBefore,
    memoryAfter,
    resources,
    words: consumedWords,
  };

  await generator.dispose();
  return result;
}

async function loadLanguageWords(languageFile: string): Promise<string[]> {
  const response = await fetch(`/languages/${languageFile}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch language file ${languageFile}: ${response.status}`,
    );
  }

  const parsed = (await response.json()) as { words?: string[] };

  if (!parsed.words) {
    throw new Error(`Language file missing words: ${languageFile}`);
  }

  return parsed.words;
}

async function captureMemorySnapshot(): Promise<MemorySnapshot> {
  const memorySnapshot: MemorySnapshot = {};

  if ("memory" in performance) {
    const memory = (
      performance as Performance & {
        memory?: {
          jsHeapSizeLimit: number;
          totalJSHeapSize: number;
          usedJSHeapSize: number;
        };
      }
    ).memory;

    if (memory) {
      memorySnapshot.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      memorySnapshot.totalJSHeapSize = memory.totalJSHeapSize;
      memorySnapshot.usedJSHeapSize = memory.usedJSHeapSize;
    }
  }

  if ("measureUserAgentSpecificMemory" in performance) {
    try {
      const detailedMemory = await (
        performance as Performance & {
          measureUserAgentSpecificMemory?: () => Promise<{
            bytes: number;
            breakdown: Array<{ bytes: number; types: string[] }>;
          }>;
        }
      ).measureUserAgentSpecificMemory?.();

      if (detailedMemory) {
        memorySnapshot.uaBytes = detailedMemory.bytes;
        memorySnapshot.uaBreakdown = detailedMemory.breakdown;
      }
    } catch {
      // ignore browser memory API failures
    }
  }

  return memorySnapshot;
}

function collectResourceSnapshots(startTime: number): ResourceSnapshot[] {
  return performance
    .getEntriesByType("resource")
    .filter((entry): entry is PerformanceResourceTiming => {
      return (
        entry instanceof PerformanceResourceTiming &&
        entry.startTime >= startTime &&
        (entry.name.includes("huggingface.co") ||
          entry.name.includes("githubusercontent.com") ||
          entry.name.includes("jsdelivr.net") ||
          entry.name.includes("gpt_tokens.json") ||
          entry.name.includes("vocab.bpe") ||
          entry.name.includes("/languages/"))
      );
    })
    .map((entry) => ({
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      initiatorType: entry.initiatorType,
    }));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor(sortedValues.length * ratio)),
  );

  return sortedValues[index] ?? 0;
}
