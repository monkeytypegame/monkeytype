import { onlineManager } from "@tanstack/solid-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSessionQuery,
  type SessionQuery,
} from "../../../src/ts/queries/utils/session-query";
import {
  optimisticMutation,
  rollbackById,
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
): ReturnType<typeof optimisticMutation<Data, string>> {
  return optimisticMutation<Data, string>({
    query,
    name: "rename",
    recipe: (data, name) => {
      data.name = name;
    },
    request,
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
    const mutation = optimisticMutation<Data, number>({
      query,
      name: "bump",
      recipe: (data, count) => {
        data.name = "bumped";
        data.count = count;
      },
      request: req.request,
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

  it("rolls back a field the recipe added", async () => {
    const { query } = setup();
    const mutation = optimisticMutation<Data, string>({
      query,
      name: "addExtra",
      recipe: (data, extra) => {
        data.extra = extra;
      },
      request: async () => {
        throw new Error("nope");
      },
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
type List = { items: Item[] };

function setupList(items: Item[]): SessionQuery<List> {
  const query = createSessionQuery<List>({
    name: `mutation-list-test-${keyIndex++}`,
    fetch: async () => ({ items: [] }),
  });
  query.replace({ items });
  return query;
}

const byId = rollbackById<List, Item>({
  list: (data) => data.items,
  id: (item) => item._id,
});

const names = (query: SessionQuery<List>): string[] =>
  query.get()?.items.map((item) => `${item._id}:${item.name}`) ?? [];

describe("rollbackById", () => {
  function renameItem(
    query: SessionQuery<List>,
    request: (vars: Item) => Promise<Item>,
  ): ReturnType<typeof optimisticMutation<List, Item>> {
    return optimisticMutation<List, Item>({
      query,
      name: "renameItem",
      recipe: (data, { _id, name }) => {
        const item = data.items.find((it) => it._id === _id);
        if (item !== undefined) item.name = name;
      },
      request,
      rollback: byId,
    });
  }

  function deleteItem(
    query: SessionQuery<List>,
    request: (id: string) => Promise<string>,
  ): ReturnType<typeof optimisticMutation<List, string>> {
    return optimisticMutation<List, string>({
      query,
      name: "deleteItem",
      recipe: (data, id) => {
        data.items = data.items.filter((it) => it._id !== id);
      },
      request,
      rollback: byId,
    });
  }

  type Insert = { tempId: string; _id?: string; name: string };

  function addItem(
    query: SessionQuery<List>,
    request: (vars: Insert) => Promise<Insert>,
  ): ReturnType<typeof optimisticMutation<List, Insert>> {
    return optimisticMutation<List, Insert>({
      query,
      name: "addItem",
      // idempotent: the server's id replaces the temporary one
      recipe: (data, { tempId, _id, name }) => {
        data.items = data.items.filter((it) => it._id !== tempId);
        const id = _id ?? tempId;
        if (!data.items.some((it) => it._id === id)) {
          data.items.push({ _id: id, name });
        }
      },
      request,
      rollback: byId,
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
    query.update((data) => {
      const item = data.items[0];
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
