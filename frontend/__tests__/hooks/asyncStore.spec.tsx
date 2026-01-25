import { render, waitFor } from "@solidjs/testing-library";
import { For } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAsyncStore } from "../../src/ts/hooks/asyncStore";

const fetcher = vi.fn();
const initialValue = vi.fn(() => ({ data: null }));

describe("createAsyncStore", () => {
  beforeEach(() => {
    fetcher.mockClear();
    initialValue.mockClear();
  });

  it("should initialize with the correct state", () => {
    const store = createAsyncStore({ name: "test", fetcher, initialValue });

    expect(store.state().state).toBe("unresolved");
    expect(store.state().loading).toBe(false);
    expect(store.state().ready).toBe(false);
    expect(store.state().refreshing).toBe(false);
    expect(store.state().error).toBeUndefined();
    expect(store.store()).toEqual({ data: null });
  });

  it("should transition to loading when load is called", async () => {
    const store = createAsyncStore({ name: "test", fetcher, initialValue });
    store.load();

    expect(store.state().state).toBe("pending");
    expect(store.state().loading).toBe(true);
  });

  it("should enable loading if ready is called", async () => {
    const store = createAsyncStore({ name: "test", fetcher, initialValue });
    fetcher.mockResolvedValueOnce({ data: "test" });

    await store.ready();
  });

  it("should call the fetcher when load is called", async () => {
    const store = createAsyncStore({ name: "test", fetcher, initialValue });
    fetcher.mockResolvedValueOnce({ data: "test" });
    store.load();

    await store.ready();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.state().state).toBe("ready");
    expect(store.store()).toEqual({ data: "test" });
  });

  it("should handle error when fetcher fails", async () => {
    fetcher.mockRejectedValueOnce(new Error("Failed to load"));
    const store = createAsyncStore({ name: "test", fetcher, initialValue });

    store.load();

    await expect(store.ready()).rejects.toThrow("Failed to load");

    expect(store.state().state).toBe("errored");
    expect(store.state().error).toEqual(new Error("Failed to load"));
  });

  it("should transition to refreshing state on refresh", async () => {
    const store = createAsyncStore({ name: "test", fetcher, initialValue });
    fetcher.mockResolvedValueOnce({ data: "test" });
    store.load();

    store.refresh(); // trigger refresh
    expect(store.state().state).toBe("refreshing");
    expect(store.state().refreshing).toBe(true);
  });

  it("should trigger load when refresh is called and shouldLoad is false", async () => {
    const store = createAsyncStore({ name: "test", fetcher, initialValue });
    fetcher.mockResolvedValueOnce({ data: "test" });
    expect(store.state().state).toBe("unresolved");

    store.refresh();
    expect(store.state().state).toBe("refreshing");
    expect(store.state().refreshing).toBe(true);

    // Wait for the store to be ready after fetching
    await store.ready();

    // Ensure the store's state is 'ready' after the refresh
    expect(store.state().state).toBe("ready");
    expect(store.store()).toEqual({ data: "test" });
  });

  it("should reset the store to its initial value on reset", async () => {
    const store = createAsyncStore({ name: "test", fetcher, initialValue });
    fetcher.mockResolvedValueOnce({ data: "test" });
    store.load();

    await store.ready();

    expect(store.store()).toEqual({ data: "test" });

    store.reset();
    expect(store.state().state).toBe("unresolved");
    expect(store.state().loading).toBe(false);
    expect(store.store()).toEqual({ data: null });
  });

  it("should persist changes", async () => {
    const persist = vi.fn();
    persist.mockResolvedValue({});
    const store = createAsyncStore<{ data: string }>({
      name: "test",
      fetcher,
      persist,
    });
    fetcher.mockResolvedValueOnce({ data: "test" });
    store.load();

    await store.ready();

    store.update({ data: "newValue" });
    expect(persist).toHaveBeenCalledExactlyOnceWith({ data: "newValue" });
  });

  it("fails updating when not ready", async () => {
    const store = createAsyncStore<{ data: string }>({
      name: "test",
      fetcher,
    });

    expect(() => store.update({})).toThrowError(
      "Store test cannot update in state unresolved",
    );
  });

  it("should be reactive", async () => {
    const store = createAsyncStore<{
      data: string;
      nested?: { number: number };
      list: string[];
    }>({ name: "test", fetcher });
    fetcher.mockResolvedValueOnce({
      data: "test",
      nested: { number: 1 },
      list: ["Bob", "Kevin"],
    });
    fetcher.mockResolvedValueOnce({
      data: "updated",
      nested: { number: 2 },
      list: ["Bob", "Stuart"],
    });

    const { container } = render(() => (
      <span>
        State: {store.state().state} <br />
        Loading: {store.state().loading ? "true" : "false"} <br />
        Data: {store.store()?.data ?? "empty"} <br />
        Number: {store.store()?.nested?.number ?? "no number"}; List:{" "}
        <For fallback="no list" each={store.store()?.list}>
          {(item) => <span>{item},</span>}
        </For>
      </span>
    ));

    //initial state
    expect(container.textContent).toContain("Loading: false");
    expect(container.textContent).toContain("State: unresolved");
    expect(container.textContent).toContain("Number: no number");
    expect(container.textContent).toContain("List: no list");

    //load
    store.load();
    expect(container.textContent).toContain("Loading: true");
    expect(container.textContent).toContain("State: pending");
    expect(container.textContent).toContain("Data: empty");
    expect(container.textContent).toContain("Number: no number");
    expect(container.textContent).toContain("List: no list");

    //resource loaded successfull
    await store.ready();
    expect(container.textContent).toContain("Loading: false");
    expect(container.textContent).toContain("State: ready");
    expect(container.textContent).toContain("Data: test");
    expect(container.textContent).toContain("Number: 1");
    expect(container.textContent).toContain("List: Bob,Kevin,");

    //modify
    store.update({ nested: { number: 3 } });
    expect(container.textContent).toContain("Loading: false");
    expect(container.textContent).toContain("State: ready");
    expect(container.textContent).toContain("Data: test");
    expect(container.textContent).toContain("Number: 3");
    expect(container.textContent).toContain("List: Bob,Kevin,");

    //refresh
    store.refresh();
    await store.ready();
    expect(container.textContent).toContain("Loading: false");
    expect(container.textContent).toContain("State: ready");
    expect(container.textContent).toContain("Data: updated");
    expect(container.textContent).toContain("Number: 2");
    expect(container.textContent).toContain("List: Bob,Stuart,");

    //reset back to initial state
    store.reset();
    await waitFor(() =>
      store.state().state === "unresolved" ? true : undefined,
    );
    expect(container.textContent).toContain("Loading: false");
    expect(container.textContent).toContain("State: unresolved");
    expect(container.textContent).toContain("Number: no number");
    expect(container.textContent).toContain("List: no list");
  });
});
