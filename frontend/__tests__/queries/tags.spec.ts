import { UserTag } from "@monkeytype/schemas/users";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Ape from "../../src/ts/ape";
import { queryClient } from "../../src/ts/queries";
import {
  deleteTag,
  fillTags,
  getActiveTags,
  getLocalTagPB,
  getTags,
  insertTag,
  isTagActive,
  saveLocalTagPB,
  setActiveTags,
  toggleTagActive,
  updateTagName,
} from "../../src/ts/queries/tags";
import { filters } from "../../src/ts/states/result-filters";

function tag(_id: string, name: string): UserTag {
  return {
    _id,
    name,
    personalBests: { time: {}, words: {}, quote: {}, zen: {}, custom: {} },
  };
}

function ok<T>(data: T = null as T): never {
  return { status: 200, body: { message: "ok", data } } as never;
}

function fail(message: string): never {
  return { status: 500, body: { message } } as never;
}

/** A response that waits until the test settles it. */
function deferred(): {
  promise: Promise<never>;
  resolve: (value: never) => void;
} {
  let resolve!: (value: never) => void;
  const promise = new Promise<never>((r) => (resolve = r));
  return { promise, resolve };
}

const names = (): string[] => getTags().map((it) => `${it._id}:${it.name}`);

beforeEach(() => {
  fillTags([tag("b", "beta"), tag("a", "alpha")]);
  setActiveTags([]);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await queryClient.resetQueries({ queryKey: ["user"] });
});

describe("reads", () => {
  it("fills from the user download with spaces in names, sorted", () => {
    fillTags([tag("b", "beta_tag"), tag("a", "alpha")]);
    expect(names()).toEqual(["a:alpha", "b:beta tag"]);
    expect(filters.tags["b"]).toBe(true);
  });

  it("is empty after the sign-out reset", async () => {
    await queryClient.resetQueries({ queryKey: ["user"] });
    await vi.waitFor(() => expect(getTags()).toEqual([]));
  });

  it("reads the active tags from the local active ids, ignoring unknown ones", () => {
    setActiveTags(["b", "gone"]);
    expect(getActiveTags().map((it) => it._id)).toEqual(["b"]);
    expect(isTagActive("b")).toBe(true);
    expect(isTagActive("a")).toBe(false);
  });
});

describe("active state", () => {
  it("toggles and persists to localStorage", () => {
    toggleTagActive("a");
    expect(isTagActive("a")).toBe(true);
    expect(JSON.parse(localStorage.getItem("activeTags") ?? "")).toEqual(["a"]);

    toggleTagActive("a");
    expect(isTagActive("a")).toBe(false);
  });
});

describe("optimistic actions", () => {
  it("rolls back only the renamed tag, keeping one renamed meanwhile", async () => {
    const slow = deferred();
    vi.spyOn(Ape.users, "editTag")
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce(ok());

    const renaming = updateTagName({ tagId: "a", newName: "alpha_2" });
    expect(names()).toEqual(["a:alpha 2", "b:beta"]);
    await updateTagName({ tagId: "b", newName: "beta 2" });
    slow.resolve(fail("nope"));

    await expect(renaming).rejects.toThrow("Failed to update tag: nope");
    expect(names()).toEqual(["a:alpha", "b:beta 2"]);
    expect(Ape.users.editTag).toHaveBeenCalledWith({
      body: { tagId: "a", newName: "alpha_2" },
    });
  });

  it("replaces the temporary tag with the server's", async () => {
    const slow = deferred();
    vi.spyOn(Ape.users, "createTag").mockReturnValue(slow.promise);

    const inserting = insertTag({ name: "gamma tag" });
    expect(getTags().map((it) => it.name)).toEqual([
      "alpha",
      "beta",
      "gamma tag",
    ]);
    slow.resolve(ok(tag("c", "gamma_tag")));
    await inserting;

    expect(names()).toEqual(["a:alpha", "b:beta", "c:gamma tag"]);
    expect(filters.tags["c"]).toBe(true);
  });

  it("removes the added tag when the insert fails", async () => {
    vi.spyOn(Ape.users, "createTag").mockResolvedValue(fail("nope"));

    await expect(insertTag({ name: "gamma" })).rejects.toThrow(
      "Failed to add tag: nope",
    );
    expect(names()).toEqual(["a:alpha", "b:beta"]);
  });

  it("deletes a tag and its active state", async () => {
    vi.spyOn(Ape.users, "deleteTag").mockResolvedValue(ok());
    setActiveTags(["a", "b"]);

    await deleteTag({ tagId: "a" });

    expect(names()).toEqual(["b:beta"]);
    expect(isTagActive("a")).toBe(false);
    expect(isTagActive("b")).toBe(true);
  });
});

describe("personal bests", () => {
  it("saves and reads a local tag pb", () => {
    const read = (): number =>
      getLocalTagPB(
        "a",
        "time",
        "15",
        false,
        false,
        "english",
        "normal",
        false,
      );
    expect(read()).toBe(0);

    saveLocalTagPB(
      "a",
      "time",
      "15",
      false,
      false,
      "english",
      "normal",
      false,
      100,
      98,
      105,
      80,
    );
    expect(read()).toBe(100);

    saveLocalTagPB(
      "a",
      "time",
      "15",
      false,
      false,
      "english",
      "normal",
      false,
      110,
      98,
      115,
      80,
    );
    expect(read()).toBe(110);
    expect(getTags()[0]?.personalBests.time["15"]).toHaveLength(1);
  });
});
