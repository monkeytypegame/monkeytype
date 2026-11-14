import { onlineManager } from "@tanstack/solid-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSessionQuery,
  type SessionQuery,
} from "../../../src/ts/queries/utils/session-query";
import {
  type OptimisticMutation,
  optimisticMutation,
  runMutation,
} from "../../../src/ts/queries/utils/optimistic-mutation";

type Data = { name: string; count: number; extra?: string };

let keyIndex = 0;
function setup(initial: Data | null = { name: "a", count: 1 }): {
  query: SessionQuery<Data>;
} {
  const query = createSessionQuery<Data>({
    name: `mutation-test-${keyIndex++}`,
    fetch: async () => ({ name: "fetched", count: 0 }),
  });
  query.replace(initial ?? undefined);
  return { query };
}

type Ok<V> = { status: 200; body: { message: string; data: V } };

/**
 * The tests' requests resolve to the values to keep: sent as a 200 that
 * `reconcileVars` reads back.
 */
function viaApi<V>(request: (vars: V) => Promise<V>): {
  mutationFn: (vars: V) => Promise<Ok<V>>;
  reconcileVars: (vars: V, data: V) => V;
} {
  return {
    mutationFn: async (vars) => ({
      status: 200,
      body: { message: "ok", data: await request(vars) },
    }),
    reconcileVars: (_vars, data) => data,
  };
}

/** A request that waits until the test settles it. */
function pending<V>(): {
  request: (vars: V) => Promise<V>;
  calls: V[];
  resolve: (value: V) => void;
  reject: (error: unknown) => void;
} {
  const calls: V[] = [];
  const settlers: { resolve: (v: V) => void; reject: (e: unknown) => void }[] =
    [];
  return {
    calls,
    request: async (vars) =>
      new Promise<V>((resolve, reject) => {
        calls.push(vars);
        settlers.push({ resolve, reject });
      }),
    resolve: (value) => settlers.shift()?.resolve(value),
    reject: (error) => settlers.shift()?.reject(error),
  };
}

function rename(
  query: SessionQuery<Data>,
  request: (name: string) => Promise<string>,
): OptimisticMutation<Data, string> {
  return optimisticMutation<Data, string, Ok<string>>({
    query,
    name: "rename",
    applyFn: (data, name) => {
      data.name = name;
    },
    ...viaApi(request),
  });
}

describe("optimisticMutation", () => {
  afterEach(() => onlineManager.setOnline(true));

  it("keys the mutation under its query", () => {
    const { query } = setup();
    expect(rename(query, async (n) => n).mutationKey).toEqual([
      ...query.key,
      "rename",
    ]);
  });

  it("applies the change before the request settles", async () => {
    const { query } = setup();
    const req = pending<string>();

    const done = runMutation(rename(query, req.request), "b");
    await vi.waitFor(() => expect(req.calls).toEqual(["b"]));
    expect(query.get()?.name).toBe("b");

    req.resolve("b");
    expect(await done).toEqual({ data: undefined, error: null });
  });

  it("keeps the server's values on success", async () => {
    const { query } = setup();

    const result = await runMutation(
      rename(query, async (name) => `${name}!`),
      "b",
    );

    expect(result.error).toBeNull();
    expect(query.get()).toEqual({ name: "b!", count: 1 });
  });

  it("fails with the server's message on a non-200 and rolls back", async () => {
    const { query } = setup();
    const mutation = optimisticMutation({
      query,
      name: "rename",
      applyFn: (data, name: string) => {
        data.name = name;
      },
      mutationFn: async () => ({
        status: 409 as const,
        body: { message: "taken" },
      }),
    });

    const result = await runMutation(mutation, "b");

    expect(result.error?.message).toBe("taken");
    expect(query.get()).toEqual({ name: "a", count: 1 });
  });

  it("keeps the values as sent on a 200 without `reconcileVars`", async () => {
    const { query } = setup();
    const mutation = optimisticMutation({
      query,
      name: "rename",
      applyFn: (data, name: string) => {
        data.name = name;
      },
      mutationFn: async () => ({
        status: 200 as const,
        body: { message: "ok" },
      }),
    });

    expect((await runMutation(mutation, "b")).error).toBeNull();
    expect(query.get()).toEqual({ name: "b", count: 1 });
  });

  it("returns a failure as an error, never throws, and rolls back", async () => {
    const { query } = setup();

    const result = await runMutation(
      rename(query, async () => {
        throw new Error("taken");
      }),
      "b",
    );

    expect(result).toEqual({ data: null, error: new Error("taken") });
    expect(query.get()).toEqual({ name: "a", count: 1 });
  });

  it("wraps a non-Error failure in an Error", async () => {
    const { query } = setup();

    const result = await runMutation(
      rename(query, async () => Promise.reject("nope")),
      "b",
    );

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("nope");
  });

  it("keeps a field changed since by a direct write", async () => {
    const { query } = setup();
    const req = pending<number>();
    const mutation = optimisticMutation<Data, number, Ok<number>>({
      query,
      name: "bump",
      applyFn: (data, count) => {
        data.name = "bumped";
        data.count = count;
      },
      ...viaApi(req.request),
    });

    const done = runMutation(mutation, 5);
    await vi.waitFor(() => expect(req.calls).toHaveLength(1));
    query.update((data) => {
      data.count = 9;
    });
    req.reject(new Error("nope"));
    await done;

    // name is rolled back; count was changed since, so it stays
    expect(query.get()).toEqual({ name: "a", count: 9 });
  });

  it("keeps a newer mutation's change when an older one fails", async () => {
    const { query } = setup();
    const req = pending<string>();
    const mutation = rename(query, req.request);

    const older = runMutation(mutation, "b");
    const newer = runMutation(mutation, "c");
    await vi.waitFor(() => expect(req.calls).toEqual(["b", "c"]));
    expect(query.get()?.name).toBe("c");

    req.reject(new Error("nope"));
    expect((await older).error?.message).toBe("nope");
    expect(query.get()?.name).toBe("c");

    req.resolve("c");
    expect((await newer).error).toBeNull();
    expect(query.get()?.name).toBe("c");
  });

  it("rolls back a field `applyFn` added", async () => {
    const { query } = setup();
    const mutation = optimisticMutation<Data, string, Ok<string>>({
      query,
      name: "addExtra",
      applyFn: (data, extra) => {
        data.extra = extra;
      },
      ...viaApi<string>(async () => {
        throw new Error("nope");
      }),
    });

    await runMutation(mutation, "x");

    expect(query.get()?.extra).toBeUndefined();
  });

  it("fails without data and never sends the request", async () => {
    const { query } = setup(null);
    const request = vi.fn(async (name: string) => name);

    const result = await runMutation(rename(query, request), "b");

    expect(result.error?.message).toBe("Not signed in");
    expect(request).not.toHaveBeenCalled();
    expect(query.get()).toBeUndefined();
  });

  it("fails and rolls back at once while offline, instead of pausing", async () => {
    const { query } = setup();
    onlineManager.setOnline(false);

    const result = await runMutation(
      rename(query, async () => {
        throw new Error("network");
      }),
      "b",
    );

    expect(result.error?.message).toBe("network");
    expect(query.get()?.name).toBe("a");
  });
});

type Item = { _id: string; name: string };

function setupList(items: Item[]): SessionQuery<Item[]> {
  const query = createSessionQuery<Item[]>({
    name: `mutation-list-test-${keyIndex++}`,
    fetch: async () => [],
    id: (item) => item._id,
  });
  query.replace(items);
  return query;
}

const names = (query: SessionQuery<Item[]>): string[] =>
  query.get()?.map((item) => `${item._id}:${item.name}`) ?? [];

describe("a list query's mutations roll back by id", () => {
  it("requires an id for a list query, and none for a record", () => {
    // @ts-expect-error a list query names its items' id
    createSessionQuery<Item[]>({ name: "x", fetch: async () => [] });
    createSessionQuery<Data>({
      name: "y",
      fetch: async () => ({ name: "", count: 0 }),
      // @ts-expect-error a record has no id
      id: () => "",
    });
    expect(true).toBe(true);
  });

  function renameItem(
    query: SessionQuery<Item[]>,
    request: (vars: Item) => Promise<Item>,
  ): OptimisticMutation<Item[], Item> {
    return optimisticMutation<Item[], Item, Ok<Item>>({
      query,
      name: "renameItem",
      applyFn: (items, { _id, name }) => {
        const item = items.find((it) => it._id === _id);
        if (item !== undefined) item.name = name;
      },
      ...viaApi(request),
    });
  }

  function deleteItem(
    query: SessionQuery<Item[]>,
    request: (id: string) => Promise<string>,
  ): OptimisticMutation<Item[], string> {
    return optimisticMutation<Item[], string, Ok<string>>({
      query,
      name: "deleteItem",
      applyFn: (items, id) => {
        const index = items.findIndex((it) => it._id === id);
        if (index !== -1) items.splice(index, 1);
      },
      ...viaApi(request),
    });
  }

  type Insert = { tempId: string; _id?: string; name: string };

  function addItem(
    query: SessionQuery<Item[]>,
    request: (vars: Insert) => Promise<Insert>,
  ): OptimisticMutation<Item[], Insert> {
    return optimisticMutation<Item[], Insert, Ok<Insert>>({
      query,
      name: "addItem",
      // idempotent: the server's id replaces the temporary one
      applyFn: (items, { tempId, _id, name }) => {
        const temp = items.findIndex((it) => it._id === tempId);
        if (temp !== -1) items.splice(temp, 1);
        const id = _id ?? tempId;
        if (!items.some((it) => it._id === id)) items.push({ _id: id, name });
      },
      ...viaApi(request),
    });
  }

  it("undoes only its own item when other items changed meanwhile", async () => {
    const query = setupList([
      { _id: "a", name: "A" },
      { _id: "b", name: "B" },
    ]);
    const req = pending<Item>();

    const renaming = runMutation(renameItem(query, req.request), {
      _id: "a",
      name: "A2",
    });
    await vi.waitFor(() => expect(req.calls).toHaveLength(1));
    await runMutation(
      deleteItem(query, async (id) => id),
      "b",
    );
    req.reject(new Error("nope"));

    expect((await renaming).error?.message).toBe("nope");
    // A gets its old name back, B stays deleted
    expect(names(query)).toEqual(["a:A"]);
  });

  it("removes an added item when the add fails", async () => {
    const query = setupList([{ _id: "a", name: "A" }]);

    const result = await runMutation(
      addItem(query, async () => {
        throw new Error("nope");
      }),
      { tempId: "temp", name: "T" },
    );

    expect(result.error?.message).toBe("nope");
    expect(names(query)).toEqual(["a:A"]);
  });

  it("puts a removed item back where it was when the delete fails", async () => {
    const query = setupList([
      { _id: "a", name: "A" },
      { _id: "b", name: "B" },
      { _id: "c", name: "C" },
    ]);

    await runMutation(
      deleteItem(query, async () => {
        throw new Error("nope");
      }),
      "b",
    );

    expect(names(query)).toEqual(["a:A", "b:B", "c:C"]);
  });

  it("keeps an item changed again since", async () => {
    const query = setupList([{ _id: "a", name: "A" }]);
    const req = pending<Item>();

    const renaming = runMutation(renameItem(query, req.request), {
      _id: "a",
      name: "A2",
    });
    await vi.waitFor(() => expect(req.calls).toHaveLength(1));
    query.update((items) => {
      const item = items[0];
      if (item !== undefined) item.name = "A3";
    });
    req.reject(new Error("nope"));
    await renaming;

    expect(names(query)).toEqual(["a:A3"]);
  });

  it("replaces a temporary id with the server's on success", async () => {
    const query = setupList([{ _id: "a", name: "A" }]);
    const req = pending<Insert>();

    const adding = runMutation(addItem(query, req.request), {
      tempId: "temp",
      name: "T",
    });
    await vi.waitFor(() => expect(names(query)).toEqual(["a:A", "temp:T"]));
    req.resolve({ tempId: "temp", _id: "real", name: "T" });

    expect((await adding).error).toBeNull();
    expect(names(query)).toEqual(["a:A", "real:T"]);
  });
});
