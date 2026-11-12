import { describe, expect, it, vi } from "vitest";

import {
  createSessionQuery,
  type SessionQuery,
} from "../../../src/ts/queries/utils/session-query";
import {
  optimisticMutation,
  runMutation,
} from "../../../src/ts/queries/utils/optimistic-mutation";

type Data = { name: string; count: number; extra?: string };

let keyIndex = 0;
function setup(initial: Data | null = { name: "a", count: 1 }): {
  query: SessionQuery<Data>;
} {
  const query = createSessionQuery<Data>({
    key: ["user", `mutation-test-${keyIndex++}`],
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
});
