import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEffect, createRoot } from "solid-js";

vi.mock("../../src/ts/ape", () => ({
  default: {
    users: {
      getCustomThemes: vi.fn(async () => ({
        status: 200,
        body: {
          data: [
            { _id: "c2", name: "zebra", colors: [] },
            { _id: "c1", name: "mine", colors: [] },
          ],
        },
      })),
      deleteCustomTheme: vi.fn(async () => ({ status: 200, body: {} })),
    },
  },
}));

import Ape from "../../src/ts/ape";
import {
  areCustomThemesLoaded,
  haveCustomThemesFailed,
  retryCustomThemes,
  deleteCustomTheme,
  getCustomTheme,
  getCustomThemes,
} from "../../src/ts/collections/custom-themes";
import { queryClient } from "../../src/ts/queries/index";
import { setUserId } from "../../src/ts/states/core";

const names = (themes: { name: string }[]): string[] =>
  themes.map((it) => it.name);

/** Lets a queued effect update run (a set signal flushes on the next turn). */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Polls until the predicate holds; fetches settle across microtask turns. */
async function waitFor(predicate: () => boolean, what: string): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 2_000) {
      throw new Error(`timed out waiting for ${what}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/** Whether the collection's query fetched at least once. */
function hasDownloaded(): boolean {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ["user", "customThemes"] })
    .some((query) => query.state.data !== undefined);
}

/**
 * Like the filter presets collection: its sync starts at module load
 * (`startSync: true`), which in the app is before the auth state resolves, so
 * its query starts disabled and never re-evaluates `enabled` on its own.
 * Sign in must kick the download: the footer's theme indicator and the
 * settings' theme list read it, and the account-independent readers are not
 * guaranteed to run after a sign in.
 */
describe("customThemes collection", () => {
  beforeEach(async () => {
    setUserId(null);
    await flush();
    vi.mocked(Ape.users.getCustomThemes).mockClear();
  });

  it("does not download while signed out", async () => {
    await flush();
    expect(Ape.users.getCustomThemes).not.toHaveBeenCalled();
  });

  it("downloads after sign in", async () => {
    setUserId("uid");
    await waitFor(hasDownloaded, "the customThemes query to fetch");
    expect(Ape.users.getCustomThemes).toHaveBeenCalled();
  });

  it("is empty while signed out", () => {
    expect(getCustomThemes()).toEqual([]);
  });

  it("returns the loaded themes sorted by name", async () => {
    setUserId("uid");
    await waitFor(() => getCustomThemes().length === 2, "the themes to load");
    expect(names(getCustomThemes())).toEqual(["mine", "zebra"]);
    expect(getCustomTheme("c2")?.name).toEqual("zebra");
  });

  it("reads a delete synchronously and re-runs effects", async () => {
    setUserId("uid");
    await waitFor(() => getCustomThemes().length === 2, "the themes to load");
    const seen: string[][] = [];
    const dispose = createRoot((dispose) => {
      createEffect(() => seen.push(names(getCustomThemes())));
      return dispose;
    });

    const deleted = deleteCustomTheme({ themeId: "c2" });

    expect(getCustomTheme("c2")).toBeUndefined();
    expect(seen.at(-1)).toEqual(["mine"]);
    await deleted;
    dispose();
  });

  it("empties on sign out", async () => {
    setUserId("uid");
    await waitFor(() => getCustomThemes().length > 0, "the themes to load");
    setUserId(null);
    expect(getCustomThemes()).toEqual([]);
  });

  it("reports loaded only once signed in and downloaded", async () => {
    expect(areCustomThemesLoaded()).toBe(false);
    setUserId("uid");
    await waitFor(areCustomThemesLoaded, "the themes to load");
    setUserId(null);
    expect(areCustomThemesLoaded()).toBe(false);
  });

  it("drops the previous user's themes until the new ones load", async () => {
    setUserId("uid");
    await waitFor(areCustomThemesLoaded, "the themes to load");
    setUserId(null);

    let release = (): void => undefined;
    vi.mocked(Ape.users.getCustomThemes).mockImplementationOnce(
      async () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              status: 200,
              body: { data: [{ _id: "c3", name: "other", colors: [] }] },
            } as never);
        }),
    );
    setUserId("uid2");
    await flush();

    expect(getCustomThemes()).toEqual([]);
    expect(areCustomThemesLoaded()).toBe(false);

    release();
    await waitFor(areCustomThemesLoaded, "the new themes to load");
    expect(names(getCustomThemes())).toEqual(["other"]);
  });

  it("reports a failed download, and loads on retry", async () => {
    // no retries: the failure is final at once
    queryClient.setQueryDefaults(["user", "customThemes"], { retry: false });
    vi.mocked(Ape.users.getCustomThemes).mockRejectedValueOnce(
      new Error("offline"),
    );
    setUserId("uid4");
    await waitFor(haveCustomThemesFailed, "the download to fail");

    expect(areCustomThemesLoaded()).toBe(false);

    retryCustomThemes();
    expect(haveCustomThemesFailed()).toBe(false);
    await waitFor(areCustomThemesLoaded, "the themes to load on retry");
    expect(haveCustomThemesFailed()).toBe(false);
    expect(getCustomThemes()).toHaveLength(2);
    queryClient.setQueryDefaults(["user", "customThemes"], {});
  });
});
