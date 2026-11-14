import { CustomTheme } from "@monkeytype/schemas/users";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Ape from "../../src/ts/ape";
import { queryClient } from "../../src/ts/queries";
import {
  addCustomTheme,
  deleteCustomTheme,
  editCustomTheme,
  getCustomTheme,
  getCustomThemes,
  loadCustomThemes,
} from "../../src/ts/queries/custom-themes";
import { UserDataLoadError } from "../../src/ts/utils/user-data-load-error";

const colors = (color: string): CustomTheme["colors"] =>
  Array(10).fill(color) as CustomTheme["colors"];

function theme(_id: string, name: string): CustomTheme {
  return { _id, name, colors: colors("#000000") };
}

function ok<T>(data: T = null as T): never {
  return { status: 200, body: { message: "ok", data } } as never;
}

function fail(message: string, status = 500): never {
  return { status, body: { message } } as never;
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

/** Downloads these custom themes. */
async function download(themes: CustomTheme[]): Promise<void> {
  vi.spyOn(Ape.users, "getCustomThemes").mockResolvedValue(ok(themes));
  await loadCustomThemes();
}

const names = (): string[] =>
  getCustomThemes().map((it) => `${it._id}:${it.name}`);

beforeEach(async () => {
  await download([theme("b", "beta"), theme("a", "alpha")]);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await queryClient.resetQueries({ queryKey: ["user"] });
});

describe("reads", () => {
  it("loads the custom themes, sorted by name", () => {
    expect(names()).toEqual(["a:alpha", "b:beta"]);
    expect(getCustomTheme("b")?.name).toBe("beta");
  });

  it("fails to load with the response status, leaving no themes", async () => {
    await queryClient.resetQueries({ queryKey: ["user"] });
    vi.spyOn(Ape.users, "getCustomThemes").mockResolvedValue(
      fail("slow down", 429),
    );

    const error = await loadCustomThemes().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UserDataLoadError);
    expect((error as UserDataLoadError).responseCode).toBe(429);
    expect(getCustomThemes()).toEqual([]);
  });

  it("is empty after the sign-out reset", async () => {
    await queryClient.resetQueries({ queryKey: ["user"] });
    await vi.waitFor(() => expect(getCustomThemes()).toEqual([]));
  });
});

describe("optimistic actions", () => {
  it("replaces the temporary theme with the server's", async () => {
    const slow = deferred();
    vi.spyOn(Ape.users, "addCustomTheme").mockReturnValue(slow.promise);

    const adding = addCustomTheme({ name: "gamma", colors: colors("#ffffff") });
    expect(getCustomThemes().map((it) => it.name)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    slow.resolve(ok({ _id: "c", name: "gamma" }));
    expect((await adding).error).toBeNull();

    expect(names()).toEqual(["a:alpha", "b:beta", "c:gamma"]);
    expect(getCustomTheme("c")).toEqual({
      _id: "c",
      name: "gamma",
      colors: colors("#ffffff"),
    });
    expect(Ape.users.addCustomTheme).toHaveBeenCalledWith({
      body: { name: "gamma", colors: colors("#ffffff") },
    });
  });

  it("removes the added theme when the add fails", async () => {
    vi.spyOn(Ape.users, "addCustomTheme").mockResolvedValue(fail("nope"));

    const result = await addCustomTheme({
      name: "gamma",
      colors: colors("#f"),
    });
    expect(result.error?.message).toBe("nope");
    expect(names()).toEqual(["a:alpha", "b:beta"]);
  });

  it("edits the name and colors", async () => {
    vi.spyOn(Ape.users, "editCustomTheme").mockResolvedValue(ok());

    const result = await editCustomTheme({
      themeId: "a",
      name: "alpha_2",
      colors: colors("#ffffff"),
    });

    expect(result.error).toBeNull();
    expect(getCustomTheme("a")).toEqual({
      _id: "a",
      name: "alpha_2",
      colors: colors("#ffffff"),
    });
    expect(Ape.users.editCustomTheme).toHaveBeenCalledWith({
      body: {
        themeId: "a",
        theme: { name: "alpha_2", colors: colors("#ffffff") },
      },
    });
  });

  it("rolls back only the edited theme, keeping one deleted meanwhile", async () => {
    const slow = deferred();
    vi.spyOn(Ape.users, "editCustomTheme").mockReturnValue(slow.promise);
    vi.spyOn(Ape.users, "deleteCustomTheme").mockResolvedValue(ok());

    const editing = editCustomTheme({
      themeId: "a",
      name: "alpha_2",
      colors: colors("#ffffff"),
    });
    expect(names()).toEqual(["a:alpha_2", "b:beta"]);
    await deleteCustomTheme({ themeId: "b" });
    slow.resolve(fail("nope"));

    expect((await editing).error?.message).toBe("nope");
    expect(names()).toEqual(["a:alpha"]);
    expect(getCustomTheme("a")?.colors).toEqual(colors("#000000"));
  });

  it("puts a theme back when the delete fails", async () => {
    vi.spyOn(Ape.users, "deleteCustomTheme").mockResolvedValue(fail("nope"));

    expect((await deleteCustomTheme({ themeId: "a" })).error?.message).toBe(
      "nope",
    );
    expect(names()).toEqual(["a:alpha", "b:beta"]);
    expect(Ape.users.deleteCustomTheme).toHaveBeenCalledWith({
      body: { themeId: "a" },
    });
  });
});
