import type { QueryKey } from "@tanstack/solid-query";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUserProfile } from "../../src/ts/queries/profile";
import {
  getContributorsQueryOptions,
  getSpeedHistogramQueryOptions,
  getSupportersQueryOptions,
  getTypingStatsQueryOptions,
} from "../../src/ts/queries/public";
import { getServerConfigurationQueryOptions } from "../../src/ts/queries/server-configuration";
import {
  __testing,
  getNotificationHistory,
} from "../../src/ts/states/notifications";
import {
  App,
  cleanupApp,
  deferred,
  flush,
  renderApp,
} from "../__harness__/app-shell";

const serverConfigurationKey = getServerConfigurationQueryOptions().queryKey;

function retryButton(app: App): HTMLButtonElement {
  const button = [
    ...(app.pageElement()?.querySelectorAll("button") ?? []),
  ].find((el) => el.textContent?.includes("Retry"));
  if (button === undefined) throw new Error("no Retry button");
  return button;
}

describe("app shell routing", () => {
  afterEach(() => {
    cleanupApp();
  });

  describe("guards", () => {
    it.each(["/account", "/account-settings", "/friends"])(
      "redirects a signed out user from %s to login",
      async (url) => {
        const app = renderApp({ url, auth: "signedOut" });
        await app.settle();

        expect(app.url()).toBe("/login");
        expect(app.shownPage()).toBe("login");
      },
    );

    it("redirects a signed in user from login to account", async () => {
      const app = renderApp({ url: "/login", auth: "signedIn" });
      await app.settle();

      expect(app.url()).toBe("/account");
    });

    it("lets a signed in user open account settings", async () => {
      const app = renderApp({ url: "/account-settings", auth: "signedIn" });
      await app.settle();

      expect(app.url()).toBe("/account-settings");
      expect(app.shownPage()).toBe("accountSettings");
    });

    it("sends guarded pages to the test page when auth is unavailable", async () => {
      const app = renderApp({ url: "/friends", authAvailable: false });
      await app.settle();

      expect(app.url()).toBe("/");
      expect(app.shownPage()).toBe("test");
    });

    it("waits for the first auth state before redirecting on a refresh", async () => {
      const app = renderApp({ url: "/account-settings", auth: "pending" });
      await flush();

      expect(app.url()).toBe("/account-settings");
      expect(app.shownPage()).toBe("loading");

      app.auth.signOut();
      await app.settle();

      expect(app.url()).toBe("/login");
      expect(app.shownPage()).toBe("login");
    });

    it("keeps a guarded page when the first auth state is signed in", async () => {
      const app = renderApp({ url: "/account-settings", auth: "pending" });
      await flush();

      app.auth.signIn();
      await app.settle();

      expect(app.url()).toBe("/account-settings");
      expect(app.shownPage()).toBe("accountSettings");
    });

    it("redirects to account when the user signs in on login", async () => {
      const app = renderApp({ url: "/login", auth: "signedOut" });
      await app.settle();

      app.auth.signIn();
      await app.settle();

      expect(app.url()).toBe("/account");
    });

    it("redirects to login when the user signs out on a guarded page", async () => {
      const app = renderApp({ url: "/account-settings", auth: "signedIn" });
      await app.settle();

      app.auth.signOut();
      await app.settle();

      expect(app.url()).toBe("/login");
      expect(app.shownPage()).toBe("login");
    });

    it("redirects when navigating to a guarded page", async () => {
      const app = renderApp({ url: "/about", auth: "signedOut" });
      await app.settle();
      expect(app.shownPage()).toBe("about");

      await app.navigate({ to: "/friends" });
      await app.settle();

      expect(app.url()).toBe("/login");
      expect(app.shownPage()).toBe("login");
    });
  });

  describe("loading", () => {
    it("shows the loading page while the user data downloads", async () => {
      const userData = deferred();
      const app = renderApp({ url: "/settings", auth: "pending" });
      await flush();

      app.auth.signIn({ userData: userData.promise });
      await flush();
      expect(app.shownPage()).toBe("loading");

      userData.resolve();
      await app.settle();

      expect(app.shownPage()).toBe("settings");
    });

    it("shows leaderboards straight away with a cached server configuration", async () => {
      const app = renderApp({
        url: "/about",
        queryData: [[serverConfigurationKey, {}]],
      });
      await app.settle();

      await app.navigate({ to: "/leaderboards" });
      expect(app.runningFades()).toHaveLength(1);
      expect(app.finishFade()).toBe(0);
      await app.settle();

      expect(app.shownPage()).toBe("leaderboards");
    });
  });

  describe("loading bar", () => {
    it("splits a refresh on account between user data and results", async () => {
      const userData = deferred();
      const app = renderApp({
        url: "/account",
        auth: "pending",
        results: "pending",
      });
      await flush();
      app.auth.signIn({ userData: userData.promise });
      await flush();
      expect(app.loadingBar()).toEqual({
        width: "50%",
        text: "Downloading user data...",
      });

      userData.resolve();
      await flush();
      expect(app.loadingBar()).toEqual({
        width: "90%",
        text: "Downloading results...",
      });

      app.blockingData.loadResults();
      await flush();
      expect(app.loadingBar()).toEqual({ width: "100%", text: "Done" });

      await app.settle();
      expect(app.shownPage()).toBe("account");
    });

    it("gives the user data the whole bar on a refresh on the test page", async () => {
      const userData = deferred();
      const app = renderApp({ url: "/", auth: "pending" });
      await flush();
      app.auth.signIn({ userData: userData.promise });
      await flush();
      expect(app.loadingBar()).toEqual({
        width: "90%",
        text: "Downloading user data...",
      });

      userData.resolve();
      await flush();
      expect(app.loadingBar()).toEqual({ width: "100%", text: "Done" });

      await app.settle();
      expect(app.shownPage()).toBe("test");
    });

    it("gives the results the whole bar going from the test page to account", async () => {
      const app = renderApp({
        url: "/",
        auth: "signedIn",
        results: "pending",
      });
      await app.settle();

      // resolves only once the account page loaded
      void app.navigate({ to: "/account" });
      await flush();
      // the test page fades out before the loading page shows
      expect(app.finishFade()).toBe(0);
      await flush();
      expect(app.loadingBar()).toEqual({
        width: "90%",
        text: "Downloading results...",
      });

      app.blockingData.loadResults();
      await flush();
      expect(app.loadingBar()).toEqual({ width: "100%", text: "Done" });

      await app.settle();
      expect(app.shownPage()).toBe("account");
    });

    it("finishes at done when a planned step turned out not to be needed", async () => {
      const userData = deferred();
      const app = renderApp({
        url: "/account",
        auth: "pending",
        results: "pending",
      });
      await flush();
      app.auth.signIn({ userData: userData.promise });
      await flush();
      expect(app.loadingBar()?.width).toBe("50%");

      // the results arrive with the user data, before the account page loads
      app.blockingData.loadResults();
      userData.resolve();
      await flush();
      expect(app.loadingBar()).toEqual({ width: "100%", text: "Done" });

      await app.settle();
      expect(app.shownPage()).toBe("account");
    });
  });

  describe("background data", () => {
    // a response that never arrives, recording that the fetch started
    function slowResponse(key: QueryKey): {
      response: [QueryKey, () => Promise<unknown>];
      started: () => boolean;
    } {
      let started = false;
      const fetch = async (): Promise<unknown> => {
        started = true;
        return deferred<unknown>().promise;
      };
      return { response: [key, fetch], started: () => started };
    }

    it("shows about straight away while its data loads", async () => {
      const responses = [
        getContributorsQueryOptions().queryKey,
        getSupportersQueryOptions().queryKey,
        getTypingStatsQueryOptions().queryKey,
        getSpeedHistogramQueryOptions().queryKey,
      ].map(slowResponse);
      const app = renderApp({
        url: "/settings",
        queryResponses: responses.map(({ response }) => response),
      });
      await app.settle();

      await app.navigate({ to: "/about" });
      await app.settle();

      expect(app.shownPage()).toBe("about");
      expect(responses.map((response) => response.started())).toEqual([
        true,
        true,
        true,
        true,
      ]);
    });

    it.each([
      {
        page: "leaderboards",
        url: "/leaderboards",
        keys: [serverConfigurationKey],
      },
      {
        page: "profile",
        url: "/profile/bob",
        keys: [getUserProfile("bob").queryKey],
      },
      {
        page: "login",
        url: "/login",
        keys: [serverConfigurationKey],
      },
      { page: "settings", url: "/settings", keys: [] },
    ] as const)(
      "shows $page straight away while its data loads",
      async ({ page, url, keys }) => {
        const responses = keys.map(slowResponse);
        const app = renderApp({
          url: "/",
          queryResponses: responses.map(({ response }) => response),
        });
        await app.settle();

        app.router.history.push(url);
        await app.settle();

        expect(app.shownPage()).toBe(page);
        expect(responses.every((response) => response.started())).toBe(true);
      },
    );

    it("shows leaderboards on first load while the server configuration loads", async () => {
      const configuration = slowResponse(serverConfigurationKey);
      const app = renderApp({
        url: "/leaderboards",
        queryResponses: [configuration.response],
      });
      await app.settle();

      expect(app.shownPage()).toBe("leaderboards");
      expect(configuration.started()).toBe(true);
    });

    it("keeps the loading page up until the account results are ready", async () => {
      const app = renderApp({ url: "/", auth: "signedIn", results: "pending" });
      await app.settle();

      // resolves once the navigation finished loading
      void app.navigate({ to: "/account" });
      await app.settle({ waitForRouter: false });
      expect(app.shownPage()).toBe("loading");

      app.blockingData.loadResults();
      await app.settle();

      expect(app.shownPage()).toBe("account");
    });

    it("keeps the loading page up until the friends are ready", async () => {
      const app = renderApp({
        url: "/",
        auth: "signedIn",
        friends: "pending",
        queryData: [[serverConfigurationKey, {}]],
      });
      await app.settle();

      // resolves once the navigation finished loading
      void app.navigate({ to: "/friends" });
      await app.settle({ waitForRouter: false });
      expect(app.shownPage()).toBe("loading");

      app.blockingData.loadFriends();
      await app.settle();

      expect(app.shownPage()).toBe("friends");
    });
  });

  describe("pending spinner", () => {
    beforeEach(() => {
      vi.useFakeTimers({
        toFake: [
          "setTimeout",
          "clearTimeout",
          "Date",
          "requestAnimationFrame",
          "cancelAnimationFrame",
        ],
      });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    // friends are downloaded, but their refetch on every visit hangs
    async function slowFriendsNavigation(): Promise<App> {
      const app = renderApp({
        url: "/",
        auth: "signedIn",
        friendsRefresh: "pending",
      });
      await app.settle();
      // resolves once the navigation finished loading
      void app.navigate({ to: "/friends" });
      return app;
    }

    it("shows the loading page with a spinner when a navigation takes longer than 500ms", async () => {
      const app = await slowFriendsNavigation();

      await vi.advanceTimersByTimeAsync(450);
      expect(app.pagesInDom()).toEqual(["test"]);
      expect(app.runningFades()).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(100);
      await app.settle({ waitForRouter: false });
      expect(app.shownPage()).toBe("loading");
      expect(app.loadingIndicator()).toBe("spinner");
    });

    it("keeps the spinner at least 500ms once shown", async () => {
      const app = await slowFriendsNavigation();
      await vi.advanceTimersByTimeAsync(500);
      await app.settle({ waitForRouter: false });
      expect(app.shownPage()).toBe("loading");

      // the navigation finishes right after the spinner showed
      app.blockingData.refreshFriends();
      await vi.advanceTimersByTimeAsync(400);
      await app.settle({ waitForRouter: false });
      expect(app.shownPage()).toBe("loading");

      await vi.advanceTimersByTimeAsync(200);
      await app.settle();
      expect(app.shownPage()).toBe("friends");
    });

    it("shows no spinner for a navigation faster than 500ms", async () => {
      const app = await slowFriendsNavigation();
      await vi.advanceTimersByTimeAsync(300);
      app.blockingData.refreshFriends();
      await flush();

      // straight from the test page to friends
      expect(app.pagesInDom()).toEqual(["test"]);
      expect(app.finishFade()).toBe(0);
      await flush();
      expect(app.pagesInDom()).toEqual(["friends"]);
      await vi.advanceTimersByTimeAsync(1000);
      await app.settle();
      expect(app.pagesInDom()).toEqual(["friends"]);
    });

    it("shows the loading bar, not the spinner, for a slow loading step", async () => {
      const app = renderApp({ url: "/", auth: "signedIn", results: "pending" });
      await app.settle();
      // resolves once the navigation finished loading
      void app.navigate({ to: "/account" });
      await app.settle({ waitForRouter: false });
      expect(app.loadingIndicator()).toBe("bar");

      await vi.advanceTimersByTimeAsync(1000);
      await flush();
      // the same loading page, no fade to a second one
      expect(app.runningFades()).toHaveLength(0);
      expect(app.pagesInDom()).toEqual(["loading"]);
      expect(app.loadingIndicator()).toBe("bar");

      app.blockingData.loadResults();
      await vi.advanceTimersByTimeAsync(500);
      await app.settle();
      expect(app.shownPage()).toBe("account");
    });

    it("shows the spinner for a slow navigation after one with a loading step", async () => {
      const app = renderApp({
        url: "/account",
        auth: "signedIn",
        results: "pending",
        friendsRefresh: "pending",
      });
      await app.settle({ waitForRouter: false });
      expect(app.loadingIndicator()).toBe("bar");
      app.blockingData.loadResults();
      await vi.advanceTimersByTimeAsync(500);
      await app.settle();
      expect(app.shownPage()).toBe("account");

      void app.navigate({ to: "/friends" });
      await vi.advanceTimersByTimeAsync(600);
      await app.settle({ waitForRouter: false });
      expect(app.shownPage()).toBe("loading");
      expect(app.loadingIndicator()).toBe("spinner");
    });
  });

  describe("page fade", () => {
    it("fades the old page out before the new page is in the DOM", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      expect(app.pagesInDom()).toEqual(["about"]);
      expect(app.runningFades()).toHaveLength(1);
      expect(app.finishFade()).toBe(0);

      await flush();
      expect(app.pagesInDom()).toEqual(["settings"]);
      expect(app.finishFade()).toBe(1);
      expect(app.runningFades()).toHaveLength(0);
    });

    it("holds the new page at opacity 0 until its fade in finishes", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      app.finishFade();
      await flush();

      expect(app.pageElement()?.style.opacity).toBe("0");
      app.finishFade();
      await flush();
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("ends on the last page after navigating during the fade out", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await app.navigate({ to: "/login" });
      await app.navigate({ to: "/profile" });
      await flush();
      expect(app.finishFade()).toBe(0);
      await app.settle();

      expect(app.pagesInDom()).toEqual(["profileSearch"]);
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("ends on the last page after navigating during the fade in", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      app.finishFade();
      await flush();
      expect(app.pagesInDom()).toEqual(["settings"]);

      await app.navigate({ to: "/login" });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["login"]);
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("ends on the last page when navigating before the fade in starts", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await flush();
      app.finishFade();
      // the fade in starts on the next frame - navigate before it
      await app.navigate({ to: "/login" });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["login"]);
      expect(app.pageElement()?.style.opacity).toBe("");
    });

    it("mounts page content only once its wrapper is in the document", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await app.settle();

      expect(app.pageMounts()).toContainEqual({
        page: "Settings",
        attached: true,
      });
      expect(app.pageMounts().every((mount) => mount.attached)).toBe(true);
    });

    it("fades the first page in from the loading page", async () => {
      const userData = deferred();
      const app = renderApp({ url: "/settings", auth: "pending" });
      await flush();
      app.auth.signIn({ userData: userData.promise });
      await flush();
      expect(app.pagesInDom()).toEqual(["loading"]);
      // the loading page fades in on boot
      expect(app.finishFade()).toBe(1);

      userData.resolve();
      await flush();
      expect(app.pagesInDom()).toEqual(["loading"]);
      expect(app.finishFade()).toBe(0);

      await flush();
      expect(app.pagesInDom()).toEqual(["settings"]);
      expect(app.finishFade()).toBe(1);
    });
  });

  describe("errors", () => {
    async function failUserData(url: string): Promise<App> {
      const app = renderApp({ url, auth: "pending" });
      await flush();
      const userData = Promise.reject(new Error("server is down"));
      // the router takes the download later - don't flag it as unhandled
      userData.catch(() => undefined);
      app.auth.signIn({ userData });
      await app.settle();
      return app;
    }

    it("shows the loading page with the error when a blocking load fails", async () => {
      const app = await failUserData("/settings");

      expect(app.pagesInDom()).toEqual(["loading"]);
      expect(app.pageElement()?.textContent).toContain(
        "Failed to load user data: server is down",
      );
    });

    it("retries the load and shows the page when it succeeds", async () => {
      const app = await failUserData("/settings");
      expect(app.shownPage()).toBe("loading");

      retryButton(app).click();
      await app.settle();

      expect(app.pagesInDom()).toEqual(["settings"]);
    });
  });

  describe("not found", () => {
    it.each(["/nope", "/settings/nope", "/profile/someone/nope"])(
      "shows the 404 page for %s",
      async (url) => {
        const app = renderApp({ url });
        await app.settle();

        expect(app.shownPage()).toBe("404");
        expect(app.url()).toBe(url);
      },
    );

    it("shows the 404 page when navigating to an unknown url", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.router.navigate({ href: "/nope" });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["404"]);
    });

    it("shows the profile page for a profile that doesn't exist", async () => {
      const app = renderApp({ url: "/profile/nobody" });
      await app.settle();

      expect(app.shownPage()).toBe("profile");
    });
  });

  describe("leaving the test page", () => {
    it("stops the test as soon as the navigation starts, before the fade out", async () => {
      const serverConfiguration = deferred<unknown>();
      const app = renderApp({
        url: "/",
        queryResponses: [
          [serverConfigurationKey, async () => serverConfiguration.promise],
        ],
      });
      await app.settle();
      app.test.start();

      void app.navigate({ to: "/leaderboards" });
      await flush();

      // the leaderboards route is still loading, the test page fades out to
      // the loading page
      expect(app.pagesInDom()).toEqual(["test"]);
      expect(app.runningFades().map((fade) => fade.opacity)).toEqual([0]);
      expect(app.test.isRunning()).toBe(false);
    });

    it("keeps the test running when the test page reloads in place", async () => {
      const app = renderApp({ url: "/", auth: "signedOut" });
      await app.settle();
      app.test.start();

      app.auth.signIn();
      await app.settle();

      expect(app.shownPage()).toBe("test");
      expect(app.test.isRunning()).toBe(true);
    });

    it.each([
      ["the test is restarting", "setRestarting"],
      ["the result is calculating", "setResultCalculating"],
    ] as const)("blocks navigation while %s", async (_, busy) => {
      const app = renderApp({ url: "/" });
      await app.settle();
      app.test[busy](true);

      // a blocked navigation never resolves
      void app.navigate({ to: "/about" });
      await app.settle();

      expect(app.url()).toBe("/");
      expect(app.shownPage()).toBe("test");
    });

    it("blocks navigation during a test with the no quit funbox, with a notice", async () => {
      __testing.clearNotificationHistory();
      const app = renderApp({ url: "/" });
      await app.settle();
      app.test.enableNoQuit();
      app.test.start();

      // a blocked navigation never resolves
      void app.navigate({ to: "/about" });
      await app.settle();

      expect(app.url()).toBe("/");
      expect(app.shownPage()).toBe("test");
      expect(app.test.isRunning()).toBe(true);
      expect(getNotificationHistory().map((n) => n.message)).toEqual([
        "No quit funbox is active. Please finish the test.",
      ]);
    });

    it("lets a test with the no quit funbox be left once it ended", async () => {
      const app = renderApp({ url: "/" });
      await app.settle();
      app.test.enableNoQuit();

      await app.navigate({ to: "/about" });
      await app.settle();

      expect(app.shownPage()).toBe("about");
    });
  });

  it("redirects /verify to / keeping search and hash", async () => {
    const app = renderApp({ url: "/verify?mode=verifyEmail&oobCode=abc#top" });
    await app.settle();

    expect(app.url()).toBe("/?mode=verifyEmail&oobCode=abc#top");
    expect(app.shownPage()).toBe("test");
  });
});
