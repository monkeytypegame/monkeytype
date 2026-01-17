import { createLoadingStore } from "../../../src/ts/signals/util/loadingStore";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockFetcher = vi.fn();
const initialValue = vi.fn(() => ({ data: null }));

describe("createLoadingStore", () => {
  beforeEach(() => {
    mockFetcher.mockClear();
    initialValue.mockClear();
  });

  it("should initialize with the correct state", () => {
    const store = createLoadingStore(mockFetcher, initialValue);

    expect(store.state().state).toBe("unresolved");
    expect(store.state().loading).toBe(false);
    expect(store.state().ready).toBe(false);
    expect(store.state().refreshing).toBe(false);
    expect(store.state().error).toBeUndefined();
    expect(store.store).toEqual({ data: null });
  });

  it("should transition to loading when load is called", async () => {
    const store = createLoadingStore(mockFetcher, initialValue);
    store.load();

    expect(store.state().state).toBe("pending");
    expect(store.state().loading).toBe(true);
  });

  it("should call the fetcher when load is called", async () => {
    const store = createLoadingStore(mockFetcher, initialValue);
    mockFetcher.mockResolvedValueOnce({ data: "test" });
    store.load();

    await store.ready();

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(store.state().state).toBe("ready");
    expect(store.store).toEqual({ data: "test" });
  });

  it("should handle error when fetcher fails", async () => {
    mockFetcher.mockRejectedValueOnce(new Error("Failed to load"));
    const store = createLoadingStore(mockFetcher, initialValue);

    store.load();

    await expect(store.ready()).rejects.toThrow("Failed to load");

    expect(store.state().state).toBe("errored");
    expect(store.state().error).toEqual(new Error("Failed to load"));
  });

  it("should transition to refreshing state on refresh", async () => {
    const store = createLoadingStore(mockFetcher, initialValue);
    mockFetcher.mockResolvedValueOnce({ data: "test" });
    store.load();

    store.refresh(); // trigger refresh
    expect(store.state().state).toBe("refreshing");
    expect(store.state().refreshing).toBe(true);
  });

  it("should trigger load when refresh is called and shouldLoad is false", async () => {
    const store = createLoadingStore(mockFetcher, initialValue);
    mockFetcher.mockResolvedValueOnce({ data: "test" });
    expect(store.state().state).toBe("unresolved");

    store.refresh();
    expect(store.state().state).toBe("refreshing");
    expect(store.state().refreshing).toBe(true);

    // Wait for the store to be ready after fetching
    await store.ready();

    // Ensure the store's state is 'ready' after the refresh
    expect(store.state().state).toBe("ready");
    expect(store.store).toEqual({ data: "test" });
  });

  it("should reset the store to its initial value on reset", async () => {
    const store = createLoadingStore(mockFetcher, initialValue);
    mockFetcher.mockResolvedValueOnce({ data: "test" });
    store.load();

    await store.ready();

    expect(store.store).toEqual({ data: "test" });

    store.reset();
    expect(store.state().state).toBe("unresolved");
    expect(store.state().loading).toBe(false);
    expect(store.store).toEqual({ data: null });
  });

  it("should handle a promise rejection during reset", async () => {
    const store = createLoadingStore(mockFetcher, initialValue);

    // Mock the fetcher to resolve with data
    mockFetcher.mockResolvedValueOnce({ data: "test" });

    // Trigger loading the store
    store.load();

    // Wait for the store to be ready
    await store.ready();

    // Ensure the store state after loading
    expect(store.state().state).toBe("ready");
    expect(store.store).toEqual({ data: "test" });

    // Now call reset, which should reject the ready promise
    const readyPromise = store.ready(); // Grab the current ready promise

    store.reset(); // Call reset, which should reject the promise

    // Ensure the promise rejects as expected
    await expect(readyPromise).rejects.toThrow("Reset");

    // Ensure the state is reset
    expect(store.state().state).toBe("unresolved");
    expect(store.state().loading).toBe(false);
    expect(store.store).toEqual({ data: null });
  });
});
