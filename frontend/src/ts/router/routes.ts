import { createRootRoute, createRoute, redirect } from "@tanstack/solid-router";

import {
  configurationPromise as serverConfigurationPromise,
  get as getServerConfiguration,
} from "../ape/server-configuration";
import {
  invalidateConnections,
  isConnectionsReady,
  waitForConnectionsReady,
} from "../collections/connections";
import { isResultsReady, waitForResultsReady } from "../collections/results";
import { getSnapshot } from "../db";
import { authEvent } from "../events/auth";
import { isAuthAvailable } from "../firebase";
import { readAccountSettingsSearch } from "../states/account-settings";
import { isAuthenticated, setSelectedProfileName } from "../states/core";
import { readLeaderboardSearch } from "../states/leaderboard-selection";
import { withLoading } from "../states/loading-page";
import { readSettingsSearch } from "../states/settings-search";
import { PageName } from "../states/router";
import * as TodayTracker from "../test/today-tracker";
import { promiseWithResolvers } from "../utils/misc";

// NOTE: whenever adding a route add the pathname to the `firebase.json` rewrite rule

declare module "@tanstack/solid-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation needs an interface
  interface StaticDataRouteOption {
    page?: PageName;
  }
}

const { promise: firstAuthState, resolve: resolveFirstAuthState } =
  promiseWithResolvers();

let pendingUserData: Promise<void> | undefined;

authEvent.subscribe((event) => {
  if (event.type !== "authStateChanged") return;

  if (event.data.isUserSignedIn) {
    pendingUserData = event.data.loadPromise;
  }
  // awaited by waitForUserData during the initial load
  resolveFirstAuthState();
});

/**
 * Waits until the auth state is known, then shows the loading bar while the
 * user data downloads (only once per sign in).
 */
async function waitForUserData(): Promise<void> {
  await firstAuthState;

  const userData = pendingUserData;
  if (userData === undefined) return;
  pendingUserData = undefined;

  await withLoading("user data", {
    style: "bar",
    load: async () => userData,
    keyframes: [
      { percentage: 90, durationMs: 1000, text: "Downloading user data..." },
    ],
  });
}

function requireAuth(): void {
  if (!isAuthAvailable()) redirect({ to: "/", throw: true });
  if (!isAuthenticated()) redirect({ to: "/login", throw: true });
}

function guestOnly(): void {
  if (!isAuthAvailable()) redirect({ to: "/", throw: true });
  if (isAuthenticated()) redirect({ to: "/account", throw: true });
}

// renders nothing - pages are rendered by <Pages> (see components/pages/Pages.tsx)
const root = createRootRoute({ component: () => null });

// pathless layout so every page waits for auth and the user data download
const app = createRoute({
  getParentRoute: () => root,
  id: "app",
  beforeLoad: waitForUserData,
});

const test = createRoute({
  getParentRoute: () => app,
  path: "/",
  staticData: { page: "test" },
});

const verify = createRoute({
  getParentRoute: () => app,
  path: "/verify",
  beforeLoad: ({ location }) => {
    redirect({
      to: "/",
      search: location.search,
      hash: location.hash,
      throw: true,
    });
  },
});

const leaderboards = createRoute({
  getParentRoute: () => app,
  path: "/leaderboards",
  staticData: { page: "leaderboards" },
  beforeLoad: ({ search, cause }) => {
    if (cause === "enter") readLeaderboardSearch(search);
  },
  loader: async () => {
    if (getServerConfiguration() !== undefined) return;
    await withLoading("the leaderboards page", {
      style: "spinner",
      load: async () => {
        await serverConfigurationPromise;
      },
    });
  },
});

const about = createRoute({
  getParentRoute: () => app,
  path: "/about",
  staticData: { page: "about" },
});

const settings = createRoute({
  getParentRoute: () => app,
  path: "/settings",
  staticData: { page: "settings" },
  beforeLoad: ({ search, cause }) => {
    if (cause === "enter") readSettingsSearch(search);
  },
});

const login = createRoute({
  getParentRoute: () => app,
  path: "/login",
  staticData: { page: "login" },
  beforeLoad: guestOnly,
});

const account = createRoute({
  getParentRoute: () => app,
  path: "/account",
  staticData: { page: "account" },
  beforeLoad: requireAuth,
  loader: async () => {
    if (isResultsReady()) return;
    await withLoading("the account page", {
      style: "bar",
      load: async () => {
        if (getSnapshot() === null || getSnapshot() === undefined) {
          throw new Error(
            "Looks like your account data didn't download correctly. Please refresh the page.<br>If this error persists, please contact support.",
          );
        }
        await waitForResultsReady();
        TodayTracker.addAllFromToday();
      },
      keyframes: [
        { percentage: 90, durationMs: 2000, text: "Downloading results..." },
      ],
    });
  },
});

const accountSettings = createRoute({
  getParentRoute: () => app,
  path: "/account-settings",
  staticData: { page: "accountSettings" },
  beforeLoad: ({ search, cause }) => {
    requireAuth();
    if (cause === "enter") readAccountSettingsSearch(search);
  },
});

const profileSearch = createRoute({
  getParentRoute: () => app,
  path: "/profile",
  staticData: { page: "profileSearch" },
});

const profile = createRoute({
  getParentRoute: () => app,
  path: "/profile/$uidOrName",
  staticData: { page: "profile" },
  beforeLoad: ({ params }) => {
    setSelectedProfileName(params.uidOrName);
  },
});

const friends = createRoute({
  getParentRoute: () => app,
  path: "/friends",
  staticData: { page: "friends" },
  beforeLoad: requireAuth,
  loader: async () => {
    if (!isConnectionsReady()) {
      await withLoading("the friends page", {
        style: "bar",
        load: async () => {
          await Promise.all([
            serverConfigurationPromise,
            waitForConnectionsReady(),
          ]);
        },
        keyframes: [
          { percentage: 50, durationMs: 1500, text: "Downloading friends..." },
          {
            percentage: 50,
            durationMs: 1500,
            text: "Downloading friend requests...",
          },
        ],
      });
    }
    await invalidateConnections();
  },
});

const notFound = createRoute({
  getParentRoute: () => app,
  path: "$",
  staticData: { page: "404" },
});

export const routeTree = root.addChildren([
  app.addChildren([
    test,
    verify,
    leaderboards,
    about,
    settings,
    login,
    account,
    accountSettings,
    profileSearch,
    profile,
    friends,
    notFound,
  ]),
]);
