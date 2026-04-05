import {
  GPT,
  GPT2Tokenizer,
  cpuSoftmax,
  destroyOperations,
  sampleFromDistribution,
  selectTopK,
} from "./vendor/webgpt-vendor";

export type WebGptTokenizer = {
  getVocabSize(): number;
  encode(text: string): number[];
  decode(tokens: number[]): string;
};

type WebGptModel = {
  tokenizer: WebGptTokenizer;
  params: {
    n_ctx: number;
  };
  initialize(): Promise<void>;
  run(inputIds: number[]): Promise<Float32Array>;
  unloadBuffers(): void;
};

export type WebGptTokenizerType = "bpe";

export type WebGptTokenizerAssetUrls = {
  vocabBpeUrl: string;
  gptTokensUrl: string;
};

export type WebGptAssetUrlResolver = (relativePath: string) => string;

export type WebGptRuntimeOptions = {
  modelId?: string;
  tokenizerType?: WebGptTokenizerType;
  weightsBaseUrl?: string;
  tokenizerAssets?: Partial<WebGptTokenizerAssetUrls>;
  fetchImplementation?: typeof fetch;
};

export type WebGptRuntime = {
  modelId: string;
  device: "webgpu";
  tokenizer: WebGptTokenizer;
  maxContextWindowSize: number;
  forward(inputIds: number[]): Promise<Float32Array>;
  unloadBuffers(): void;
};

export const DEFAULT_WEBGPT_MODEL_ID = "gpt2";
// TODO: move weights to the monkeytype org or serve from the monkeytype CDN.
// Currently hosted in a personal repo for development; see
// https://github.com/hunterpaulson/webgpt-gpt2-weights for provenance.
export const DEFAULT_WEBGPT_WEIGHTS_BASE_URL =
  "https://raw.githubusercontent.com/hunterpaulson/webgpt-gpt2-weights/main/";

const DEFAULT_TOKENIZER_ASSET_URLS: WebGptTokenizerAssetUrls = {
  vocabBpeUrl: new URL("./assets/tokenization/vocab.bpe", import.meta.url).href,
  gptTokensUrl: new URL(
    "./assets/tokenization/gpt_tokens.json",
    import.meta.url,
  ).href,
};

export function getDefaultWebGptTokenizerAssetUrls(): WebGptTokenizerAssetUrls {
  return { ...DEFAULT_TOKENIZER_ASSET_URLS };
}

export function createWebGptAssetUrlResolver(
  options: Pick<
    WebGptRuntimeOptions,
    "tokenizerAssets" | "weightsBaseUrl"
  > = {},
): WebGptAssetUrlResolver {
  const tokenizerAssets = {
    ...DEFAULT_TOKENIZER_ASSET_URLS,
    ...options.tokenizerAssets,
  };
  const normalizedWeightsBaseUrl = normalizeBaseUrl(
    options.weightsBaseUrl ?? DEFAULT_WEBGPT_WEIGHTS_BASE_URL,
  );

  return (relativePath) => {
    if (relativePath === "weights/tokenization/vocab.bpe") {
      return tokenizerAssets.vocabBpeUrl;
    }

    if (relativePath === "weights/tokenization/gpt_tokens.json") {
      return tokenizerAssets.gptTokensUrl;
    }

    if (relativePath.startsWith("weights/")) {
      return resolveWeightsAssetUrl(relativePath, normalizedWeightsBaseUrl);
    }

    return relativePath;
  };
}

export async function createWebGptTokenizer(
  options: Pick<
    WebGptRuntimeOptions,
    | "tokenizerType"
    | "tokenizerAssets"
    | "weightsBaseUrl"
    | "fetchImplementation"
  > = {},
): Promise<WebGptTokenizer> {
  const tokenizerType = options.tokenizerType ?? "bpe";

  if (tokenizerType !== "bpe") {
    throw new Error(`Unsupported WebGPT tokenizer type: ${tokenizerType}`);
  }

  const tokenizer = await withPatchedFetch(
    createWebGptAssetUrlResolver(options),
    options.fetchImplementation,
    async () => {
      const createdTokenizer = new GPT2Tokenizer() as WebGptTokenizer & {
        load(): Promise<void>;
      };
      await createdTokenizer.load();
      return createdTokenizer;
    },
  );

  return tokenizer;
}

export async function createWebGptRuntime(
  options: WebGptRuntimeOptions = {},
): Promise<WebGptRuntime> {
  if (!isWebGpuAvailable()) {
    throw new Error("WebGPU is not available for WebGPT runtime");
  }

  const modelId = options.modelId ?? DEFAULT_WEBGPT_MODEL_ID;
  const tokenizerType = options.tokenizerType ?? "bpe";

  if (tokenizerType !== "bpe") {
    throw new Error(`Unsupported WebGPT tokenizer type: ${tokenizerType}`);
  }

  const model = await withPatchedFetch(
    createWebGptAssetUrlResolver(options),
    options.fetchImplementation,
    async () => {
      const createdModel = new GPT(
        modelId,
        tokenizerType,
      ) as unknown as WebGptModel;
      await createdModel.initialize();
      return createdModel;
    },
  );

  return {
    modelId: `webgpt/${modelId}`,
    device: "webgpu",
    tokenizer: model.tokenizer,
    maxContextWindowSize: model.params.n_ctx,
    async forward(inputIds) {
      return await model.run(inputIds);
    },
    unloadBuffers() {
      model.unloadBuffers();
    },
  };
}

export function destroyWebGptRuntimeResources(): void {
  destroyOperations();
}

export { cpuSoftmax, sampleFromDistribution, selectTopK };

function isWebGpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

// The vendored WebGPT code issues fetch("weights/...") with relative URLs that
// it constructs internally. Rather than forking the vendor source to thread a
// URL resolver through every call site, we temporarily patch globalThis.fetch
// during initialization to intercept those relative paths and redirect them to
// the configured weights CDN. The patch only fires once (runtime is a singleton)
// and non-weight URLs pass through untouched.
async function withPatchedFetch<T>(
  resolveAssetUrl: WebGptAssetUrlResolver,
  fetchImplementation: typeof fetch | undefined,
  callback: () => Promise<T>,
): Promise<T> {
  const runtimeGlobal = globalThis as Omit<typeof globalThis, "fetch"> & {
    fetch?: typeof fetch;
  };
  const originalFetch = runtimeGlobal.fetch;
  const activeFetch = fetchImplementation ?? originalFetch?.bind(globalThis);

  if (activeFetch === undefined) {
    throw new Error("fetch is not available for WebGPT asset loading");
  }

  runtimeGlobal.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const resolvedInput = resolveInputUrl(input);

    if (resolvedInput.startsWith("weights/")) {
      return await activeFetch(resolveAssetUrl(resolvedInput), init);
    }

    return await activeFetch(input, init);
  }) as typeof fetch;

  try {
    return await callback();
  } finally {
    if (originalFetch === undefined) {
      runtimeGlobal.fetch = undefined;
    } else {
      runtimeGlobal.fetch = originalFetch;
    }
  }
}

function resolveInputUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function resolveWeightsAssetUrl(
  relativePath: string,
  normalizedWeightsBaseUrl: string,
): string {
  const baseUrl = selectGitHubWeightsBaseUrl(
    normalizedWeightsBaseUrl,
    relativePath.endsWith(".bin"),
  );

  return new URL(relativePath, baseUrl).toString();
}

function selectGitHubWeightsBaseUrl(
  normalizedWeightsBaseUrl: string,
  wantsLfsBinary: boolean,
): string {
  const parsedBaseUrl = tryParseUrl(normalizedWeightsBaseUrl);

  if (parsedBaseUrl === null) {
    return normalizedWeightsBaseUrl;
  }

  if (parsedBaseUrl.hostname === "raw.githubusercontent.com") {
    return wantsLfsBinary
      ? (convertRawGitHubBaseUrlToMedia(parsedBaseUrl) ??
          normalizedWeightsBaseUrl)
      : normalizedWeightsBaseUrl;
  }

  if (parsedBaseUrl.hostname === "media.githubusercontent.com") {
    return wantsLfsBinary
      ? normalizedWeightsBaseUrl
      : (convertMediaGitHubBaseUrlToRaw(parsedBaseUrl) ??
          normalizedWeightsBaseUrl);
  }

  return normalizedWeightsBaseUrl;
}

function convertRawGitHubBaseUrlToMedia(baseUrl: URL): string | null {
  const pathParts = baseUrl.pathname.split("/").filter(Boolean);

  if (pathParts.length < 3) {
    return null;
  }

  const [owner, repo, ...refParts] = pathParts;

  return new URL(
    `/media/${owner}/${repo}/${refParts.join("/")}/`,
    "https://media.githubusercontent.com",
  ).toString();
}

function convertMediaGitHubBaseUrlToRaw(baseUrl: URL): string | null {
  const pathParts = baseUrl.pathname.split("/").filter(Boolean);

  if (pathParts.length < 4 || pathParts[0] !== "media") {
    return null;
  }

  const [, owner, repo, ...refParts] = pathParts;

  return new URL(
    `/${owner}/${repo}/${refParts.join("/")}/`,
    "https://raw.githubusercontent.com",
  ).toString();
}

function tryParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
