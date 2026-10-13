import { useQuery } from "@tanstack/solid-query";
import { afterEach, describe, expect, it } from "vitest";

import AsyncContent from "../../src/ts/components/common/AsyncContent";
import { getLeaderboardQueryOptions } from "../../src/ts/queries/leaderboards";
import { getServerConfigurationQueryOptions } from "../../src/ts/queries/server-configuration";
import { useAccountSettingsTab } from "../../src/ts/states/account-settings";
import { useLeaderboardSearch } from "../../src/ts/states/leaderboard-selection";
import { useSettingsHighlight } from "../../src/ts/states/settings-search";
import {
  App,
  cleanupApp,
  deferred,
  flush,
  renderApp,
  RenderAppOptions,
} from "../__harness__/app-shell";

const serverConfigurationKey = getServerConfigurationQueryOptions().queryKey;

type Probe<T> = { app: App; shown: () => unknown; hook: () => T };

/**
 * Renders the app with a probe in `page` (a stub page's component name)
 * calling `use` - the page's search hook - and showing `show(hook)` as json.
 */
function renderWithProbe<T>(
  page: string,
  use: () => T,
  show: (hook: T) => unknown,
  options: RenderAppOptions = {},
): Probe<T> {
  let hook: T | undefined;
  const app = renderApp({
    queryData: [[serverConfigurationKey, {}]],
    ...options,
    pageContent: {
      [page]: () => {
        const current = use();
        hook = current;
        return <output data-probe>{JSON.stringify(show(current))}</output>;
      },
    },
  });
  return {
    app,
    shown: () =>
      JSON.parse(
        app.container.querySelector("[data-probe]")?.textContent ?? "null",
      ) as unknown,
    hook: () => {
      if (hook === undefined) throw new Error(`${page} not shown`);
      return hook;
    },
  };
}

type LeaderboardSearch = ReturnType<typeof useLeaderboardSearch>;

function renderLeaderboards(
  options: RenderAppOptions = {},
): Probe<LeaderboardSearch> & { leaderboard: () => LeaderboardSearch } {
  const probe = renderWithProbe(
    "LeaderboardPage",
    useLeaderboardSearch,
    (leaderboard) => ({
      selection: leaderboard.selection(),
      page: leaderboard.page(),
    }),
    options,
  );
  return { ...probe, leaderboard: probe.hook };
}

describe("search params", () => {
  afterEach(() => {
    cleanupApp();
  });

  describe("leaderboards", () => {
    it("shows the selection from the url", async () => {
      const { app, shown } = renderLeaderboards({
        url: "/leaderboards?type=daily&mode=time&mode2=60&language=spanish&yesterday=t&page=3",
      });
      await app.settle();

      expect(shown()).toEqual({
        selection: {
          type: "daily",
          mode: "time",
          mode2: "60",
          language: "spanish",
          friendsOnly: false,
          previous: true,
        },
        page: 2,
      });
    });

    it("keeps ?mode2=15 as it is", async () => {
      const url =
        "/leaderboards?type=allTime&mode=time&mode2=15&language=english&page=1";
      const { app, shown } = renderLeaderboards({ url });
      await app.settle();

      expect(app.url()).toBe(url);
      expect(shown()).toMatchObject({ selection: { mode2: "15" } });
    });

    it("falls back to defaults for invalid values", async () => {
      const { app, shown } = renderLeaderboards({
        url: "/leaderboards?type=daily&mode=nope&language=elvish&page=abc&yesterday=maybe",
      });
      await app.settle();

      expect(shown()).toEqual({
        selection: {
          type: "daily",
          mode: "time",
          mode2: "15",
          language: "english",
          friendsOnly: false,
          previous: false,
        },
        page: 0,
      });
    });

    it("puts the last shown selection in the url when there is none", async () => {
      const first = renderLeaderboards({
        url: "/leaderboards?type=weekly&lastWeek=t",
      });
      await first.app.settle();
      cleanupApp();

      const { app, shown } = renderLeaderboards({ url: "/leaderboards" });
      await app.settle();

      expect(app.url()).toBe("/leaderboards?type=weekly&page=1&lastWeek=t");
      expect(shown()).toEqual({
        selection: { type: "weekly", friendsOnly: false, previous: true },
        page: 0,
      });
    });

    it("writes selection changes to the url without a history entry", async () => {
      const { app, shown, leaderboard } = renderLeaderboards({ url: "/about" });
      await app.settle();
      await app.navigate({
        to: "/leaderboards",
        search: { type: "allTime", mode: "time", mode2: "15" },
      });
      await app.settle();

      leaderboard().setSelection({
        type: "daily",
        mode: "words",
        mode2: "10",
        language: "english",
        friendsOnly: false,
        previous: true,
      });
      await app.settle();

      expect(app.url()).toBe(
        "/leaderboards?type=daily&mode=words&mode2=10&language=english&page=1&yesterday=t",
      );
      expect(shown()).toMatchObject({
        selection: { type: "daily", mode: "words", previous: true },
        page: 0,
      });

      leaderboard().setPage(4);
      await app.settle();
      expect(app.url()).toBe(
        "/leaderboards?type=daily&mode=words&mode2=10&language=english&page=5&yesterday=t",
      );
      expect(shown()).toMatchObject({ page: 4 });

      app.router.history.back();
      await app.settle();
      expect(app.url()).toBe("/about");
    });

    it("doesn't re-run the page's loader on a selection change", async () => {
      const { app, leaderboard } = renderLeaderboards({
        url: "/leaderboards?type=allTime&mode=time&mode2=15&language=english",
      });
      await app.settle();
      // the loader would wait for the server configuration again
      const configuration = deferred<unknown>();
      app.queryClient.removeQueries({ queryKey: serverConfigurationKey });
      app.queryClient.respond(
        serverConfigurationKey,
        async () => configuration.promise,
      );

      leaderboard().setPage(1);
      await flush();

      expect(app.router.state.status).toBe("idle");
      expect(app.url()).toContain("page=2");
      expect(app.shownPage()).toBe("leaderboards");
    });
    it("shows a selection change at once while its entries load", async () => {
      const selection = {
        type: "allTime",
        mode: "time",
        mode2: "15",
        language: "english",
        friendsOnly: false,
        previous: false,
      } as const;
      const entriesKey = (page: number): unknown[] =>
        getLeaderboardQueryOptions({ ...selection, page }).queryKey;
      let leaderboard: LeaderboardSearch | undefined;
      const app = renderApp({
        url: "/leaderboards?type=allTime&mode=time&mode2=15&language=english&page=1",
        queryData: [
          [serverConfigurationKey, {}],
          [entriesKey(0), { count: 500, entries: [] }],
        ],
        // the next pages never load
        queryResponses: [1, 2].map((page) => [
          entriesKey(page),
          async () => new Promise(() => undefined),
        ]),
        pageContent: {
          // like the real page: the selection, and the entries in their own
          // section reading the query
          LeaderboardPage: () => {
            leaderboard = useLeaderboardSearch();
            const { page } = leaderboard;
            const entriesQuery = useQuery(() =>
              getLeaderboardQueryOptions({ ...selection, page: page() }),
            );
            return (
              <>
                <output data-page>{page()}</output>
                <AsyncContent
                  queries={{ entriesQuery }}
                  loader={<span data-entries-loading />}
                >
                  {() => <span data-entries />}
                </AsyncContent>
              </>
            );
          },
        },
      });
      await app.settle();
      const shownPage = (): string | null | undefined =>
        app.container.querySelector("[data-page]")?.textContent;
      const entriesLoading = (): boolean =>
        app.container.querySelector("[data-entries-loading]") !== null;
      expect(shownPage()).toBe("0");
      expect(entriesLoading()).toBe(false);

      leaderboard?.setPage(1);
      await flush();

      expect(app.url()).toContain("page=2");
      expect(shownPage()).toBe("1");
      expect(entriesLoading()).toBe(true);
      expect(app.shownPage()).toBe("leaderboards");
      // the navigation doesn't wait for the entries either
      expect(app.router.state.status).toBe("idle");
    });
  });

  describe("account settings", () => {
    function renderAccountSettings(
      url: string,
    ): Probe<ReturnType<typeof useAccountSettingsTab>> {
      return renderWithProbe(
        "AccountSettingsPage",
        useAccountSettingsTab,
        (tab) => tab.tab(),
        { url, auth: "signedIn" },
      );
    }

    it("shows the tab from the url", async () => {
      const { app, shown } = renderAccountSettings(
        "/account-settings?tab=apeKeys",
      );
      await app.settle();

      expect(shown()).toBe("apeKeys");
    });

    it("shows the account tab for a missing or invalid tab", async () => {
      const { app, shown } = renderAccountSettings(
        "/account-settings?tab=nope",
      );
      await app.settle();

      expect(shown()).toBe("account");
    });

    it("writes the tab to the url without a history entry", async () => {
      const { app, shown, hook } = renderAccountSettings("/about");
      await app.settle();
      await app.navigate({ to: "/account-settings" });
      await app.settle();

      hook().setTab("dangerZone");
      await app.settle();

      expect(app.url()).toBe("/account-settings?tab=dangerZone");
      expect(shown()).toBe("dangerZone");

      app.router.history.back();
      await app.settle();
      expect(app.url()).toBe("/about");
    });
  });

  describe("settings", () => {
    function renderSettings(
      url: string,
    ): Probe<ReturnType<typeof useSettingsHighlight>> {
      return renderWithProbe(
        "SettingsPage",
        useSettingsHighlight,
        (settings) => settings.highlighted() ?? null,
        { url },
      );
    }

    it("highlights the setting from the url", async () => {
      const { app, shown } = renderSettings("/settings?highlight=fontSize");
      await app.settle();

      expect(shown()).toBe("fontSize");
    });

    it("writes a deep link to the url without a history entry", async () => {
      const { app, hook } = renderSettings("/about");
      await app.settle();
      await app.navigate({ to: "/settings" });
      await app.settle();

      const link = hook().linkTo("fontSize");
      await app.settle();

      expect(link).toBe(
        `${window.location.origin}/settings?highlight=fontSize`,
      );
      expect(app.url()).toBe("/settings?highlight=fontSize");

      app.router.history.back();
      await app.settle();
      expect(app.url()).toBe("/about");
    });
  });
});
