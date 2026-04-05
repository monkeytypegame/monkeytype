import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    createWebGptRuntime: vi.fn(),
    destroyWebGptRuntimeResources: vi.fn(),
  };
});

vi.mock("@monkeytype/webgpt-runtime", () => {
  return {
    createWebGptRuntime: mocks.createWebGptRuntime,
    destroyWebGptRuntimeResources: mocks.destroyWebGptRuntimeResources,
  };
});

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("webgpt runtime cache", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createWebGptRuntime.mockReset();
    mocks.destroyWebGptRuntimeResources.mockReset();
  });

  it("defers runtime teardown until in-flight forwards finish", async () => {
    const forwardDeferred = createDeferred<Float32Array>();
    const unloadBuffers = vi.fn();

    mocks.createWebGptRuntime.mockResolvedValue({
      modelId: "webgpt/gpt2",
      device: "webgpu",
      tokenizer: {
        getVocabSize() {
          return 1;
        },
        encode() {
          return [0];
        },
        decode() {
          return " token";
        },
      },
      maxContextWindowSize: 16,
      forward: vi.fn(() => forwardDeferred.promise),
      unloadBuffers,
    });

    const { clearWebGptRuntimeCache, loadWebGptRuntime } =
      await import("../../../src/ts/test/llm/webgpt-runtime");

    const runtime = await loadWebGptRuntime();
    const forwardPromise = runtime.forward([0]);

    clearWebGptRuntimeCache();
    await Promise.resolve();

    expect(unloadBuffers).not.toHaveBeenCalled();
    expect(mocks.destroyWebGptRuntimeResources).not.toHaveBeenCalled();

    forwardDeferred.resolve(new Float32Array([1, 2, 3]));
    await expect(forwardPromise).resolves.toEqual(new Float32Array([1, 2, 3]));

    expect(unloadBuffers).toHaveBeenCalledOnce();
    expect(mocks.destroyWebGptRuntimeResources).toHaveBeenCalledOnce();
  });

  it("keeps an acquired runtime alive until released", async () => {
    const unloadBuffers = vi.fn();
    const forward = vi.fn(async () => new Float32Array([4, 5, 6]));

    mocks.createWebGptRuntime.mockResolvedValue({
      modelId: "webgpt/gpt2",
      device: "webgpu",
      tokenizer: {
        getVocabSize() {
          return 1;
        },
        encode() {
          return [0];
        },
        decode() {
          return " token";
        },
      },
      maxContextWindowSize: 16,
      forward,
      unloadBuffers,
    });

    const {
      acquireWebGptRuntime,
      clearWebGptRuntimeCache,
      releaseWebGptRuntime,
    } = await import("../../../src/ts/test/llm/webgpt-runtime");

    const runtime = await acquireWebGptRuntime();

    clearWebGptRuntimeCache();
    await Promise.resolve();

    await expect(runtime.forward([0])).resolves.toEqual(
      new Float32Array([4, 5, 6]),
    );
    expect(unloadBuffers).not.toHaveBeenCalled();
    expect(mocks.destroyWebGptRuntimeResources).not.toHaveBeenCalled();

    releaseWebGptRuntime(runtime);

    expect(unloadBuffers).toHaveBeenCalledOnce();
    expect(mocks.destroyWebGptRuntimeResources).toHaveBeenCalledOnce();
  });
});
