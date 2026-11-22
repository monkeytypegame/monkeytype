import { Preset } from "@monkeytype/schemas/presets";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Ape from "../../src/ts/ape";
import { queryClient } from "../../src/ts/queries";
import {
  addPreset,
  deletePreset,
  editPreset,
  getPreset,
  getPresets,
  loadPresets,
} from "../../src/ts/queries/presets";
import { UserDataLoadError } from "../../src/ts/utils/user-data-load-error";

function preset(_id: string, name: string): Preset {
  return { _id, name, config: {} };
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

/** Downloads these presets. */
async function download(presets: Preset[]): Promise<void> {
  vi.spyOn(Ape.presets, "get").mockResolvedValue(ok(presets));
  await loadPresets();
}

const names = (): string[] => getPresets().map((it) => `${it._id}:${it.name}`);

beforeEach(async () => {
  await download([preset("b", "beta"), preset("a", "alpha")]);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await queryClient.resetQueries({ queryKey: ["user"] });
});

describe("reads", () => {
  it("loads the presets, names with spaces, sorted", async () => {
    await download([preset("b", "beta_preset"), preset("a", "alpha")]);
    expect(names()).toEqual(["a:alpha", "b:beta preset"]);
    expect(getPreset("b")?.name).toBe("beta preset");
  });

  it("fails to load with the response status, leaving no presets", async () => {
    await queryClient.resetQueries({ queryKey: ["user"] });
    vi.spyOn(Ape.presets, "get").mockResolvedValue(fail("slow down", 429));

    const error = await loadPresets().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UserDataLoadError);
    expect((error as UserDataLoadError).responseCode).toBe(429);
    expect(getPresets()).toEqual([]);
  });

  it("is empty after the sign-out reset", async () => {
    await queryClient.resetQueries({ queryKey: ["user"] });
    await vi.waitFor(() => expect(getPresets()).toEqual([]));
  });
});

describe("optimistic actions", () => {
  it("replaces the temporary preset with the server's", async () => {
    const slow = deferred();
    vi.spyOn(Ape.presets, "add").mockReturnValue(slow.promise);

    const adding = addPreset({
      name: "gamma_preset",
      config: { punctuation: true },
      settingGroups: ["test"],
    });
    expect(getPresets().map((it) => it.name)).toEqual([
      "alpha",
      "beta",
      "gamma preset",
    ]);
    slow.resolve(ok({ presetId: "c" }));
    expect((await adding).error).toBeNull();

    expect(names()).toEqual(["a:alpha", "b:beta", "c:gamma preset"]);
    expect(getPreset("c")).toEqual({
      _id: "c",
      name: "gamma preset",
      config: { punctuation: true },
      settingGroups: ["test"],
    });
    expect(Ape.presets.add).toHaveBeenCalledWith({
      body: {
        name: "gamma_preset",
        config: { punctuation: true },
        settingGroups: ["test"],
      },
    });
  });

  it("removes the added preset when the add fails", async () => {
    vi.spyOn(Ape.presets, "add").mockResolvedValue(fail("nope"));

    const result = await addPreset({
      name: "gamma",
      config: {},
      settingGroups: undefined,
    });
    expect(result.error?.message).toBe("nope");
    expect(names()).toEqual(["a:alpha", "b:beta"]);
  });

  it("rolls back only the edited preset, keeping one deleted meanwhile", async () => {
    const slow = deferred();
    vi.spyOn(Ape.presets, "save").mockReturnValue(slow.promise);
    vi.spyOn(Ape.presets, "delete").mockResolvedValue(ok());

    const editing = editPreset({ presetId: "a", name: "alpha 2" });
    expect(names()).toEqual(["a:alpha 2", "b:beta"]);
    await deletePreset({ presetId: "b" });
    slow.resolve(fail("nope"));

    expect((await editing).error?.message).toBe("nope");
    expect(names()).toEqual(["a:alpha"]);
    expect(Ape.presets.save).toHaveBeenCalledWith({
      body: { _id: "a", name: "alpha_2" },
    });
  });

  it("edits the config and setting groups, null for a full preset", async () => {
    vi.spyOn(Ape.presets, "save").mockResolvedValue(ok());

    await editPreset({
      presetId: "a",
      name: "alpha",
      config: { numbers: true },
      settingGroups: null,
    });

    expect(getPreset("a")).toEqual({
      _id: "a",
      name: "alpha",
      config: { numbers: true },
      settingGroups: null,
    });
    expect(Ape.presets.save).toHaveBeenCalledWith({
      body: {
        _id: "a",
        name: "alpha",
        config: { numbers: true },
        settingGroups: null,
      },
    });
  });

  it("puts a preset back when the delete fails", async () => {
    vi.spyOn(Ape.presets, "delete").mockResolvedValue(fail("nope"));

    expect((await deletePreset({ presetId: "a" })).error?.message).toBe("nope");
    expect(names()).toEqual(["a:alpha", "b:beta"]);
  });
});
