import type { QueryKey } from "@tanstack/solid-query";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
} from "../../src/ts/queries/leaderboards";
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

// the loading bar fills up from its last step to "Done" (125ms) before the
// loading page leaves
async function waitForDone(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  await flush();
}

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

describe("app shell routing", () => {
  afterEach(() => {
    cleanupApp();
    vi.unstubAllGlobals();
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
      await flush();

      // straight from about, no loading page
      expect(app.pagesInDom()).toEqual(["leaderboards"]);
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

    it("keeps the loading page up until the bar finished at done", async () => {
      const app = renderApp({ url: "/", auth: "signedIn", results: "pending" });
      await app.settle();
      void app.navigate({ to: "/account" });
      await app.settle({ waitForRouter: false });

      app.blockingData.loadResults();
      await flush();
      expect(app.loadingBar()).toEqual({ width: "100%", text: "Done" });
      // the bar takes 125ms to fill up from the last step
      await flush();
      expect(app.shownPage()).toBe("loading");

      await waitForDone();
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

      await vi.advanceTimersByTimeAsync(100);
      await app.settle({ waitForRouter: false });
      expect(app.shownPage()).toBe("loading");
      expect(app.loadingIndicator()).toBe("spinner");
    });

    it("lets the user navigate away while the spinner is shown", async () => {
      const app = await slowFriendsNavigation();
      await vi.advanceTimersByTimeAsync(500);
      await app.settle({ waitForRouter: false });
      expect(app.loadingIndicator()).toBe("spinner");

      void app.navigate({ to: "/about" });
      await vi.advanceTimersByTimeAsync(600);
      await app.settle();

      expect(app.url()).toBe("/about");
      expect(app.shownPage()).toBe("about");
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
      expect(app.pagesInDom()).toEqual(["test"]);
      app.blockingData.refreshFriends();
      await flush();

      // straight from the test page to friends
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
      const loadingPage = app.pageElement();

      await vi.advanceTimersByTimeAsync(1000);
      await flush();
      // the same loading page, no swap to a second one
      expect(app.pageElement()).toBe(loadingPage);
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

  describe("navigating while the loading bar is shown", () => {
    // test page -> account, the results download holding the bar up
    async function accountLoading(): Promise<App> {
      const app = renderApp({ url: "/", auth: "signedIn", results: "pending" });
      await app.settle();
      // resolves once the account page loaded
      void app.navigate({ to: "/account" });
      await app.settle({ waitForRouter: false });
      expect(app.loadingIndicator()).toBe("bar");
      return app;
    }

    it("blocks navigate() while the bar is shown", async () => {
      const app = await accountLoading();

      // a blocked navigation never resolves
      void app.navigate({ to: "/about" });
      await app.settle({ waitForRouter: false });

      expect(app.url()).toBe("/account");
      expect(app.loadingBar()?.text).toBe("Downloading results...");
    });

    it("blocks link clicks while the bar is shown", async () => {
      const app = await accountLoading();

      app.click({ to: "/about" });
      await app.settle({ waitForRouter: false });

      expect(app.url()).toBe("/account");
      expect(app.loadingBar()?.text).toBe("Downloading results...");
    });

    it("blocks back while the bar is shown", async () => {
      const app = renderApp({
        url: "/",
        auth: "signedIn",
        results: "pending",
        history: "browser",
      });
      await app.settle();
      void app.navigate({ to: "/account" });
      await app.settle({ waitForRouter: false });
      expect(app.loadingIndicator()).toBe("bar");

      app.router.history.back();
      // popstate fires asynchronously, the blocker then restores the entry
      await vi.waitFor(() => expect(window.location.pathname).toBe("/account"));
      await new Promise((resolve) => setTimeout(resolve, 50));
      await app.settle({ waitForRouter: false });

      expect(window.location.pathname).toBe("/account");
      expect(app.url()).toBe("/account");
      expect(app.loadingBar()?.text).toBe("Downloading results...");
    });

    it("shows the page once loaded, without a blocked navigation firing later", async () => {
      const app = await accountLoading();
      void app.navigate({ to: "/about" });
      await app.settle({ waitForRouter: false });

      app.blockingData.loadResults();
      await flush();
      expect(app.loadingBar()).toEqual({ width: "100%", text: "Done" });
      await app.settle();
      expect(app.shownPage()).toBe("account");

      await waitForDone();
      await app.settle();
      expect(app.url()).toBe("/account");
      expect(app.shownPage()).toBe("account");
    });

    it("lets the user navigate away from a failed load's error page", async () => {
      const app = await accountLoading();
      app.blockingData.failResults(new Error("server is down"));
      await app.settle();
      expect(app.loadingIndicator()).toBe("error");

      await app.navigate({ to: "/about" });
      await app.settle();

      expect(app.shownPage()).toBe("about");
    });

    it("redirects to login when the user signs out while the results download", async () => {
      const app = await accountLoading();

      app.auth.signOut();
      await app.settle();

      expect(app.url()).toBe("/login");
      expect(app.shownPage()).toBe("login");
    });

    it("redirects from login to account when the user signs in, the bar showing the download", async () => {
      const userData = deferred();
      const app = renderApp({ url: "/login", results: "pending" });
      await app.settle();

      app.auth.signIn({ userData: userData.promise });
      await app.settle({ waitForRouter: false });
      expect(app.loadingIndicator()).toBe("bar");
      userData.resolve();
      app.blockingData.loadResults();
      await app.settle();

      expect(app.url()).toBe("/account");
      expect(app.shownPage()).toBe("account");
    });
  });

  // the fades themselves: see the AnimePresence tests
  describe("page swap", () => {
    it("ends on the last page after quick navigations", async () => {
      const app = renderApp({ url: "/about" });
      await app.settle();

      await app.navigate({ to: "/settings" });
      await app.navigate({ to: "/login" });
      await app.navigate({ to: "/profile" });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["profileSearch"]);
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

    it("names the page when it fails outside a loading step", async () => {
      const app = renderApp({
        url: "/about",
        pageContent: {
          AboutPage: () => {
            throw new Error("sleep is not defined");
          },
        },
      });
      await app.settle();

      expect(app.pagesInDom()).toEqual(["loading"]);
      expect(app.loadingIndicator()).toBe("error");
      expect(app.pageElement()?.textContent).toContain(
        "Failed to load the about page: sleep is not defined",
      );
    });

    it("keeps the message of a failed loading step as it is", async () => {
      const app = await failUserData("/settings");

      const text = app.pageElement()?.textContent ?? "";
      expect(text.match(/Failed to load/g)).toHaveLength(1);
    });

    it("downloads the user data again on Retry and shows the page once it arrived", async () => {
      const app = renderApp({ url: "/settings", auth: "pending" });
      await flush();
      const retried = deferred();
      const downloads = [
        Promise.reject(new Error("server is down")),
        retried.promise,
      ];
      // the router takes the download later - don't flag it as unhandled
      downloads[0]?.catch(() => undefined);
      app.auth.signIn({
        // each call is one download
        userData: async () => downloads.shift(),
      });
      await app.settle();
      expect(app.loadingIndicator()).toBe("error");

      retryButton(app).click();
      await vi.waitFor(async () => {
        await app.settle({ waitForRouter: false });
        expect(app.loadingBar()?.text).toBe("Downloading user data...");
      });

      retried.resolve();
      await app.settle();
      expect(app.pagesInDom()).toEqual(["settings"]);
    });

    it.each(["results", "friends"] as const)(
      "retries a failing %s download once before showing the error",
      async (download) => {
        const app = renderApp({
          url: "/",
          auth: "signedIn",
          [download]: "pending",
          queryData: [[serverConfigurationKey, {}]],
        });
        await app.settle();
        void app.navigate({
          to: download === "results" ? "/account" : "/friends",
        });
        await app.settle({ waitForRouter: false });
        const before = app.blockingData.requests(download);

        if (download === "results") {
          app.blockingData.failResults(new Error("server is down"));
        } else {
          app.blockingData.failFriends(new Error("server is down"));
        }
        await app.settle();

        expect(app.loadingIndicator()).toBe("error");
        expect(app.blockingData.requests(download) - before).toBe(1);
      },
    );

    it("downloads the results again when an earlier download failed", async () => {
      const app = renderApp({ url: "/", auth: "signedIn", results: "pending" });
      await app.settle();
      // eg. the download after sign in, before the account page is opened
      app.blockingData.failResults(new Error("server is down"));
      await flush();

      void app.navigate({ to: "/account" });
      await vi.waitFor(async () => {
        await app.settle({ waitForRouter: false });
        expect(app.loadingBar()?.text).toBe("Downloading results...");
      });

      app.blockingData.loadResults();
      await app.settle();
      expect(app.pagesInDom()).toEqual(["account"]);
    });

    it("retries a failed results download", async () => {
      const app = renderApp({ url: "/", auth: "signedIn", results: "pending" });
      await app.settle();
      void app.navigate({ to: "/account" });
      await app.settle({ waitForRouter: false });

      app.blockingData.failResults(new Error("server is down"));
      await app.settle();
      expect(app.pageElement()?.textContent).toContain(
        "Failed to load the account page: server is down",
      );

      retryButton(app).click();
      await vi.waitFor(async () => {
        await app.settle({ waitForRouter: false });
        expect(app.loadingBar()?.text).toBe("Downloading results...");
      });

      app.blockingData.loadResults();
      await app.settle();
      expect(app.pagesInDom()).toEqual(["account"]);
    });

    it("retries a failed friends download", async () => {
      const app = renderApp({
        url: "/",
        auth: "signedIn",
        friends: "pending",
        queryData: [[serverConfigurationKey, {}]],
      });
      await app.settle();
      void app.navigate({ to: "/friends" });
      await app.settle({ waitForRouter: false });

      app.blockingData.failFriends(new Error("server is down"));
      await app.settle();
      expect(app.pageElement()?.textContent).toContain(
        "Failed to load the friends page: server is down",
      );

      retryButton(app).click();
      await vi.waitFor(async () => {
        await app.settle({ waitForRouter: false });
        expect(app.loadingBar()?.text).toBe("Downloading friends...");
      });

      app.blockingData.loadFriends();
      await app.settle();
      expect(app.pagesInDom()).toEqual(["friends"]);
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
    it("stops the test as soon as the navigation starts, before the page leaves", async () => {
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
      // the navigation starts after a few microtasks
      for (let i = 0; i < 10 && app.test.isRunning(); i++) {
        await Promise.resolve();
      }

      // before the test page left
      expect(app.test.isRunning()).toBe(false);
      expect(app.pagesInDom()).toEqual(["test"]);
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

    it("starts a test when typing while the test page reloads in place", async () => {
      const app = renderApp({ url: "/", auth: "signedOut" });
      await app.settle();

      // signing in reloads the test page's routes
      app.auth.signIn();
      expect(app.router.state.status).toBe("pending");
      app.test.type();

      expect(app.test.isRunning()).toBe(true);
    });

    it("starts no test when typing while leaving the test page", async () => {
      const app = renderApp({ url: "/" });
      await app.settle();

      void app.navigate({ to: "/about" });
      await flush();
      app.test.type();

      expect(app.test.isRunning()).toBe(false);
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

  it("applies url actions on the test page and drops them from the url", async () => {
    __testing.clearNotificationHistory();
    const app = renderApp({ url: "/?challenge=nope&foo=1#top" });
    await app.settle();

    expect(app.url()).toBe("/?foo=1#top");
    expect(app.shownPage()).toBe("test");
    expect(getNotificationHistory().map((n) => n.message)).toEqual([
      "Failed to load challenge: invalid name nope",
    ]);
  });

  it("applies url actions after the /verify redirect", async () => {
    __testing.clearNotificationHistory();
    const app = renderApp({ url: "/verify?challenge=nope#top" });
    await app.settle();

    expect(app.url()).toBe("/#top");
    expect(getNotificationHistory()).toHaveLength(1);
  });

  it("applies no url actions on a hover", async () => {
    const app = renderApp({ url: "/about" });
    await app.settle();
    __testing.clearNotificationHistory();

    // the test route takes any search: a shared link's params aren't typed
    await app.hover({ to: "/", search: { challenge: "nope" } as never });

    expect(app.url()).toBe("/about");
    expect(getNotificationHistory()).toEqual([]);
  });

  it("redirects /verify to / keeping search and hash", async () => {
    const app = renderApp({ url: "/verify?mode=verifyEmail&oobCode=abc#top" });
    await app.settle();

    expect(app.url()).toBe("/?mode=verifyEmail&oobCode=abc#top");
    expect(app.shownPage()).toBe("test");
  });

  describe("preloading", () => {
    it("starts about's background fetches when hovering a link to it", async () => {
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

      await app.hover({ to: "/about" });

      expect(app.shownPage()).toBe("settings");
      expect(app.url()).toBe("/settings");
      expect(responses.map((response) => response.started())).toEqual([
        true,
        true,
        true,
        true,
      ]);
    });

    it("starts the leaderboard and rank fetches of the hovered selection", async () => {
      const selection = {
        type: "allTime",
        mode: "time",
        mode2: "60",
        language: "english",
        friendsOnly: false,
        previous: false,
      } as const;
      const entries = slowResponse(
        getLeaderboardQueryOptions({ ...selection, page: 1 }).queryKey,
      );
      const rank = slowResponse(getRankQueryOptions(selection).queryKey);
      const app = renderApp({
        url: "/settings",
        auth: "signedIn",
        queryData: [[serverConfigurationKey, {}]],
        queryResponses: [entries.response, rank.response],
      });
      await app.settle();

      await app.hover({
        to: "/leaderboards",
        search: { type: "allTime", mode: "time", mode2: "60", page: 2 },
      });

      expect(app.shownPage()).toBe("settings");
      expect(entries.started()).toBe(true);
      expect(rank.started()).toBe(true);
    });

    it("switches preloading off and on from the debug handle", async () => {
      // the debug handle loads app modules: import it after the harness mocks
      await import("../../src/ts/dev/expose");
      const contributors = slowResponse(getContributorsQueryOptions().queryKey);
      const app = renderApp({
        url: "/settings",
        queryResponses: [contributors.response],
      });
      await app.settle();

      window.__mt.setPreloading(false);
      await app.hover({ to: "/about" });
      expect(contributors.started()).toBe(false);

      window.__mt.setPreloading(true);
      await app.hover({ to: "/about" });
      expect(contributors.started()).toBe(true);
    });

    it.each([
      { page: "account", url: "/account", results: "pending" },
      { page: "friends", url: "/friends", friends: "pending" },
    ] as const)(
      "shows no loading page when hovering a link to $page while its data is missing",
      async ({ url, ...blocking }) => {
        const app = renderApp({
          url: "/settings",
          auth: "signedIn",
          queryData: [[serverConfigurationKey, {}]],
          ...blocking,
        });
        await app.settle();

        await app.hover({ to: url });
        await app.settle();

        expect(app.pagesInDom()).toEqual(["settings"]);
        expect(app.loadingBar()).toBeUndefined();
        expect(app.url()).toBe("/settings");
      },
    );

    it("starts the results download when hovering a link to account", async () => {
      const app = renderApp({
        url: "/settings",
        auth: "signedIn",
        queryData: [[serverConfigurationKey, {}]],
        results: "pending",
      });
      await app.settle();
      expect(app.blockingData.requests("results")).toBe(0);

      await app.hover({ to: "/account" });
      expect(app.blockingData.requests("results")).toBe(1);
      expect(app.loadingBar()).toBeUndefined();

      // downloaded before the click: no loading page
      app.blockingData.loadResults();
      await flush();
      app.click({ to: "/account" });
      await app.settle();
      expect(app.shownPage()).toBe("account");
      expect(app.pageMounts().map((mount) => mount.page)).not.toContain(
        "loading",
      );
      expect(app.blockingData.requests("results")).toBe(1);
    });

    it.each([
      {
        page: "account",
        url: "/account",
        results: "pending",
        text: "Downloading results...",
        load: "loadResults",
      },
      {
        page: "friends",
        url: "/friends",
        friends: "pending",
        text: "Downloading friends...",
        load: "loadFriends",
      },
    ] as const)(
      "keeps the loading page up when opening a hovered $page while its data is missing",
      async ({ page, url, text, load, ...blocking }) => {
        const app = renderApp({
          url: "/settings",
          auth: "signedIn",
          queryData: [[serverConfigurationKey, {}]],
          ...blocking,
        });
        await app.settle();

        // clicked while the hover's preload (which runs no loading step) is
        // still in flight: the navigation must still wait for the data
        await app.hover({ to: url });

        // the preload ran no loading step: opening the page must still wait
        app.click({ to: url });
        await app.settle({ waitForRouter: false });

        expect(app.shownPage()).toBe("loading");
        expect(app.loadingBar()?.text).toBe(text);
        expect(app.pagesInDom()).toEqual(["loading"]);
        expect(app.pageMounts().map((mount) => mount.page)).not.toContain(page);

        app.blockingData[load]();
        await flush();
        expect(app.loadingBar()).toEqual({ width: "100%", text: "Done" });
        await waitForDone();
        await app.settle();
        expect(app.shownPage()).toBe(page);
      },
    );

    it("keeps the loading bar of a navigation when hovering a link while it loads", async () => {
      const userData = deferred();
      const app = renderApp({ url: "/", auth: "pending", results: "pending" });
      await flush();
      app.auth.signIn({ userData: userData.promise });
      await flush();

      await app.hover({ to: "/account" });
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

    it("shows no spinner when hovering a link to a slow page", async () => {
      vi.useFakeTimers({
        toFake: [
          "setTimeout",
          "clearTimeout",
          "Date",
          "requestAnimationFrame",
          "cancelAnimationFrame",
        ],
      });
      // friends are downloaded, but their refetch on every visit hangs
      const app = renderApp({
        url: "/",
        auth: "signedIn",
        friendsRefresh: "pending",
      });
      await app.settle();

      const hovered = app.hover({ to: "/friends" });
      await vi.advanceTimersByTimeAsync(1000);
      await hovered;
      await app.settle({ waitForRouter: false });

      expect(app.pagesInDom()).toEqual(["test"]);
      expect(app.loadingIndicator()).toBeUndefined();
      vi.useRealTimers();
    });

    it("keeps showing the profile when hovering a link to another profile", async () => {
      // the real page (the harness stubs it), shown inside the stub. Its
      // layout breakpoints need matchMedia, which jsdom lacks
      vi.stubGlobal("matchMedia", () => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }));
      const { ProfilePage } = await vi.importActual<
        typeof import("../../src/ts/components/pages/profile/ProfilePage")
      >("../../src/ts/components/pages/profile/ProfilePage");
      const notFound = async (): Promise<never> => {
        throw new Error("User not found");
      };
      const app = renderApp({
        url: "/profile/alice",
        queryResponses: [
          [getUserProfile("alice").queryKey, notFound],
          [getUserProfile("bob").queryKey, notFound],
        ],
        pageContent: { ProfilePage },
      });
      await app.settle();
      expect(app.pageElement()?.textContent).toContain("User alice not found");

      await app.hover({
        to: "/profile/$uidOrName",
        params: { uidOrName: "bob" },
      });
      await app.settle();

      expect(app.pageElement()?.textContent).toContain("User alice not found");
    });
  });
});
