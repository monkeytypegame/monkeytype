import { createEffect, createRoot } from "solid-js";
import { onlineManager } from "@tanstack/solid-query";
import { describe, expect, it, vi } from "vitest";

import { queryClient } from "../../../src/ts/queries";
import {
  createSessionQuery,
  type SessionQuery,
} from "../../../src/ts/queries/utils/session-query";

type Data = { name: string; list: number[]; nested: { a: number } };

let keyIndex = 0;
function setup(fetch = vi.fn(async (): Promise<Data> => data())): {
  query: SessionQuery<Data>;
  fetch: typeof fetch;
} {
  const query = createSessionQuery<Data>({
    key: ["user", `test-${keyIndex++}`],
    fetch,
  });
  return { query, fetch };
}

function data(overrides: Partial<Data> = {}): Data {
  return { name: "a", list: [1], nested: { a: 1 }, ...overrides };
}

describe("createSessionQuery", () => {
  it("downloads into the cache and resets", async () => {
    const { query, fetch } = setup();
    expect(query.get()).toBeUndefined();

    await query.download();
    expect(fetch).toHaveBeenCalledOnce();
    expect(query.get()).toEqual(data());

    query.reset();
    expect(query.get()).toBeUndefined();
  });

  it("re-runs readers at once on a change, not on a no-op write", () => {
    const { query } = setup();
    query.replace(data());
    const names: (string | undefined)[] = [];
    const dispose = createRoot((dispose) => {
      createEffect(() => names.push(query.get()?.name));
      return dispose;
    });

    query.update((d) => {
      d.name = "b";
    });
    query.update((d) => {
      d.name = "b";
    });
    dispose();

    expect(names).toEqual(["a", "b"]);
  });

  it("keeps the unchanged parts' identity", () => {
    const { query } = setup();
    query.replace(data());
    const before = query.get();

    query.update((d) => {
      d.name = "b";
    });

    expect(query.get()).not.toBe(before);
    expect(query.get()?.nested).toBe(before?.nested);
    expect(query.get()?.list).toBe(before?.list);
  });

  it("clears on the sign-out reset of the user queries", async () => {
    const { query } = setup();
    query.replace(data());

    await queryClient.resetQueries({ queryKey: ["user"] });
    await vi.waitFor(() => expect(query.get()).toBeUndefined());
  });

  it("use() shows the data and never fetches", async () => {
    const { query, fetch } = setup();
    query.replace(data());
    const { result, dispose } = createRoot((dispose) => ({
      result: query.use(),
      dispose,
    }));

    expect(result.data?.name).toBe("a");
    await queryClient.resetQueries({ queryKey: query.key });
    await vi.waitFor(() => expect(result.isPending).toBe(true));
    expect(fetch).not.toHaveBeenCalled();
    dispose();
  });

  it("fails a download at once while offline, instead of pausing", async () => {
    const { query } = setup(
      vi.fn(async (): Promise<Data> => {
        throw new Error("network");
      }),
    );
    onlineManager.setOnline(false);
    try {
      await expect(query.download()).rejects.toThrow("network");
    } finally {
      onlineManager.setOnline(true);
    }
  });
});
