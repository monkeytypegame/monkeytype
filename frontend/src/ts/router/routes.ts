import {
  createRootRouteWithContext,
  createRoute,
  redirect,
  type StaticDataRouteOption,
} from "@tanstack/solid-router";

import {
  invalidateConnections,
  waitForConnectionsReady,
} from "../collections/connections";
import { waitForResultsReady } from "../collections/results";
import { NotFoundPage } from "../components/pages/404Page";
import { AboutPage } from "../components/pages/AboutPage";
import { AccountSettingsPage } from "../components/pages/account-settings/AccountSettingsPage";
import { AccountPage } from "../components/pages/account/AccountPage";
import { FriendsPage } from "../components/pages/connections/FriendsPage";
import { LeaderboardPage } from "../components/pages/leaderboard/LeaderboardPage";
import { LoginPage } from "../components/pages/login/LoginPage";
import { pageComponent } from "../components/pages/Page";
import { ProfilePage } from "../components/pages/profile/ProfilePage";
import { ProfileSearchPage } from "../components/pages/profile/ProfileSearchPage";
import { SettingsPage } from "../components/pages/settings/SettingsPage";
import { TestPage } from "../components/pages/test/TestPage";
import { RootLayout } from "../components/RootLayout";
import { getSnapshot } from "../db";
import { AccountSettingsSearchSchema } from "../states/account-settings";
import { getUserProfile } from "../queries/profile";
import {
  getContributorsQueryOptions,
  getSpeedHistogramQueryOptions,
  getSupportersQueryOptions,
  getTypingStatsQueryOptions,
} from "../queries/public";
import { getServerConfigurationQueryOptions } from "../queries/server-configuration";
import {
  getMissingLeaderboardSearch,
  LeaderboardSearchSchema,
} from "../states/leaderboard-selection";
import { SettingsSearchSchema } from "../states/settings-search";
import * as TodayTracker from "../test/today-tracker";
import type { RouterAuth, RouterContext } from "./context";
import {
  planNavigationLoadingBar,
  runRouteLoadingStep,
  runUserDataStep,
} from "./loading-steps";

// NOTE: whenever adding a route add the pathname to the `firebase.json` rewrite rule

/**
 * Waits until the auth state is known, plans the navigation's loading bar,
 * then shows it while the user data downloads (only once per sign in).
 * `matches` are all routes of the navigation. A preload (hovered link) only
 * waits for the auth state.
 */
async function waitForUserData(
  auth: RouterAuth,
  matches: readonly { staticData: StaticDataRouteOption }[],
  preload: boolean,
): Promise<void> {
  await auth.waitForFirstState();
  // a hover plans no bar and leaves the download to the navigation
  if (preload) return;

  const userData = auth.userDataDownload();
  planNavigationLoadingBar({ matches, userData });
  if (userData === undefined) return;

  await runUserDataStep(userData);
}

function requireAuth(auth: RouterAuth): void {
  if (!auth.isAvailable()) redirect({ to: "/", throw: true });
  if (!auth.isSignedIn()) redirect({ to: "/login", throw: true });
}

function guestOnly(auth: RouterAuth): void {
  if (!auth.isAvailable()) redirect({ to: "/", throw: true });
  if (auth.isSignedIn()) redirect({ to: "/account", throw: true });
}

// each route renders its page, the root layout fades between them
const root = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  // unknown urls. The profile page shows its own message for unknown users
  notFoundComponent: pageComponent("404", NotFoundPage),
});

// pathless layout so every page waits for auth and the user data download
const app = createRoute({
  getParentRoute: () => root,
  id: "app",
  // explicit return type: inferring it would make the route tree's type
  // depend on itself through `matches` (TS7022)
  beforeLoad: async ({ context, matches, preload }): Promise<void> =>
    waitForUserData(context.auth, matches, preload),
  // the router renders a pending route only through its pending component
  // (the router's default) - shown at once, else nothing renders on first
  // load, not even the root layout
  pendingMs: 0,
  pendingMinMs: 0,
});

const test = createRoute({
  getParentRoute: () => app,
  path: "/",
  component: pageComponent("test", TestPage, {
    class: "full-width content-grid",
  }),
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
  component: pageComponent("leaderboards", LeaderboardPage),
  validateSearch: LeaderboardSearchSchema,
  // no loaderDeps: the loader doesn't read the search, so selection changes
  // don't re-run it. A loader that does lists only what it reads in loaderDeps
  beforeLoad: ({ search }) => {
    const missing = getMissingLeaderboardSearch(search);
    if (missing !== undefined) {
      redirect({
        to: "/leaderboards",
        search: missing,
        replace: true,
        throw: true,
      });
    }
  },
  // background data: start the fetch, the page shows its section loaders
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(getServerConfigurationQueryOptions());
  },
});

const about = createRoute({
  getParentRoute: () => app,
  path: "/about",
  component: pageComponent("about", AboutPage, { class: "full-width" }),
  // background data: start the fetches, the page shows its section loaders
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(getContributorsQueryOptions());
    void queryClient.prefetchQuery(getSupportersQueryOptions());
    void queryClient.prefetchQuery(getTypingStatsQueryOptions());
    void queryClient.prefetchQuery(getSpeedHistogramQueryOptions());
  },
});

const settings = createRoute({
  getParentRoute: () => app,
  path: "/settings",
  component: pageComponent("settings", SettingsPage),
  validateSearch: SettingsSearchSchema,
});

const login = createRoute({
  getParentRoute: () => app,
  path: "/login",
  component: pageComponent("login", LoginPage),
  beforeLoad: ({ context }) => guestOnly(context.auth),
  // background data: start the fetch, the page shows its section loaders
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(getServerConfigurationQueryOptions());
  },
});

const account = createRoute({
  getParentRoute: () => app,
  path: "/account",
  staticData: { loadingStep: "results" },
  component: pageComponent("account", AccountPage),
  beforeLoad: ({ context }) => requireAuth(context.auth),
  loader: async ({ preload }) => {
    // blocking data: a hover must not show the loading page, the results
    // download is waited for when the page is opened
    if (preload) return;
    await runRouteLoadingStep("results", async () => {
      if (getSnapshot() === null || getSnapshot() === undefined) {
        throw new Error(
          "Looks like your account data didn't download correctly. Please refresh the page.<br>If this error persists, please contact support.",
        );
      }
      await waitForResultsReady();
      TodayTracker.addAllFromToday();
    });
  },
});

const accountSettings = createRoute({
  getParentRoute: () => app,
  path: "/account-settings",
  component: pageComponent("accountSettings", AccountSettingsPage),
  validateSearch: AccountSettingsSearchSchema,
  beforeLoad: ({ context }) => requireAuth(context.auth),
});

const profileSearch = createRoute({
  getParentRoute: () => app,
  path: "/profile",
  component: pageComponent("profileSearch", ProfileSearchPage),
});

const profile = createRoute({
  getParentRoute: () => app,
  path: "/profile/$uidOrName",
  component: pageComponent("profile", ProfilePage),
  // background data: start the fetch, the page shows its section loaders
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(getUserProfile(params.uidOrName));
  },
});

const friends = createRoute({
  getParentRoute: () => app,
  path: "/friends",
  staticData: { loadingStep: "friends" },
  component: pageComponent("friends", FriendsPage),
  beforeLoad: ({ context }) => requireAuth(context.auth),
  loader: async ({ context: { queryClient }, preload }) => {
    // blocking data: a hover must not show the loading page
    if (preload) return;
    await runRouteLoadingStep("friends", async () => {
      await Promise.all([
        queryClient.ensureQueryData(getServerConfigurationQueryOptions()),
        waitForConnectionsReady(),
      ]);
    });
    await invalidateConnections();
  },
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
  ]),
]);
