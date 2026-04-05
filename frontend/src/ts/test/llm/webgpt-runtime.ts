import {
  createWebGptRuntime as createVendoredWebGptRuntime,
  destroyWebGptRuntimeResources,
} from "@monkeytype/webgpt-runtime";
import { decodeTokenizerVocabulary } from "./constraint-engine";
import type { DecodedToken, RuntimeDevice } from "./types";

type VendoredWebGptRuntime = Awaited<
  ReturnType<typeof createVendoredWebGptRuntime>
>;

export type WebGptRuntime = {
  modelId: string;
  device: RuntimeDevice;
  tokenizer: Awaited<
    ReturnType<typeof createVendoredWebGptRuntime>
  >["tokenizer"];
  decodedTokens: DecodedToken[];
  maxContextWindowSize: number;
  forward(inputIds: number[]): Promise<Float32Array>;
};

type ManagedRuntimeState = {
  vendoredRuntime: VendoredWebGptRuntime;
  publicRuntime: WebGptRuntime;
  inFlightForwards: number;
  retainedUsers: number;
  destroyRequested: boolean;
  destroyed: boolean;
};

const runtimeStateByPublicRuntime = new WeakMap<
  WebGptRuntime,
  ManagedRuntimeState
>();

let runtimePromise: Promise<ManagedRuntimeState> | null = null;
let activeRuntimeState: ManagedRuntimeState | null = null;

export async function loadWebGptRuntime(): Promise<WebGptRuntime> {
  const state = await getOrCreateRuntimeState();

  state.destroyRequested = false;
  return state.publicRuntime;
}

export async function acquireWebGptRuntime(): Promise<WebGptRuntime> {
  while (true) {
    const state = await getOrCreateRuntimeState();

    if (state.destroyed) {
      continue;
    }

    state.retainedUsers++;
    state.destroyRequested = false;

    if (state.destroyed) {
      state.retainedUsers--;
      continue;
    }

    return state.publicRuntime;
  }
}

export function releaseWebGptRuntime(runtime: WebGptRuntime): void {
  const state = runtimeStateByPublicRuntime.get(runtime);

  if (state === undefined || state.destroyed || state.retainedUsers === 0) {
    return;
  }

  state.retainedUsers--;
  maybeDestroyRuntime(state);
}

export function clearWebGptRuntimeCache(): void {
  if (runtimePromise === null) {
    return;
  }

  void runtimePromise
    .then((state) => {
      state.destroyRequested = true;
      maybeDestroyRuntime(state);
    })
    .catch(() => {
      clearBrokenRuntimeState();
    });
}

async function getOrCreateRuntimeState(): Promise<ManagedRuntimeState> {
  while (true) {
    runtimePromise ??= createRuntime();

    try {
      const state = await runtimePromise;

      if (state.destroyed) {
        clearBrokenRuntimeState(state);
        continue;
      }

      return state;
    } catch (error) {
      clearBrokenRuntimeState();
      throw error;
    }
  }
}

async function createRuntime(): Promise<ManagedRuntimeState> {
  const vendoredRuntime = await createVendoredWebGptRuntime();
  const decodedTokens = decodeTokenizerVocabulary({
    getVocabSize() {
      return vendoredRuntime.tokenizer.getVocabSize();
    },
    decodeToken(tokenId) {
      return vendoredRuntime.tokenizer.decode([tokenId]);
    },
  });

  const state = {
    vendoredRuntime,
    inFlightForwards: 0,
    retainedUsers: 0,
    destroyRequested: false,
    destroyed: false,
  } as ManagedRuntimeState;

  state.publicRuntime = {
    modelId: vendoredRuntime.modelId,
    device: vendoredRuntime.device,
    tokenizer: vendoredRuntime.tokenizer,
    decodedTokens,
    maxContextWindowSize: vendoredRuntime.maxContextWindowSize,
    async forward(inputIds) {
      return await forwardWithManagedRuntime(state, inputIds);
    },
  };

  runtimeStateByPublicRuntime.set(state.publicRuntime, state);

  activeRuntimeState = state;

  return state;
}

async function forwardWithManagedRuntime(
  state: ManagedRuntimeState,
  inputIds: number[],
): Promise<Float32Array> {
  if (state.destroyed) {
    throw new Error("WebGPT runtime was destroyed");
  }

  state.inFlightForwards++;

  try {
    return await state.vendoredRuntime.forward(inputIds);
  } finally {
    state.inFlightForwards--;
    maybeDestroyRuntime(state);
  }
}

function maybeDestroyRuntime(state: ManagedRuntimeState): void {
  if (
    !state.destroyRequested ||
    state.inFlightForwards > 0 ||
    state.retainedUsers > 0 ||
    state.destroyed
  ) {
    return;
  }

  state.destroyed = true;

  if (activeRuntimeState === state) {
    activeRuntimeState = null;
    runtimePromise = null;
  }

  try {
    state.vendoredRuntime.unloadBuffers();
  } catch {
    // ignore buffer cleanup failures
  }

  try {
    destroyWebGptRuntimeResources();
  } catch {
    // ignore cleanup failures
  }
}

function clearBrokenRuntimeState(state?: ManagedRuntimeState): void {
  if (state !== undefined && activeRuntimeState !== state) {
    return;
  }

  runtimePromise = null;
  activeRuntimeState = null;
}
