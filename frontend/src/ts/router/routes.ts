// The route tree: every page with its guards and loaders

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
import { pageComponent, routePage } from "../components/pages/Page";
import { ProfilePage } from "../components/pages/profile/ProfilePage";
import { ProfileSearchPage } from "../components/pages/profile/ProfileSearchPage";
import { SettingsPage } from "../components/pages/settings/SettingsPage";
import { TestPage } from "../components/pages/test/TestPage";
import { PageSwitcher } from "../components/PageSwitcher";
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
  toSelection,
} from "../states/leaderboard-selection";
import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
} from "../queries/leaderboards";
import { SettingsSearchSchema } from "../states/settings-highlight";
import * as TodayTracker from "../test/today-tracker";
import type { RouterAuth, RouterContext } from "./create-router";
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

// each route renders its page, the page switcher fades between them
const root = createRootRouteWithContext<RouterContext>()({
  component: PageSwitcher,
  // unknown urls. The profile page shows its own message for unknown users
  notFoundComponent: pageComponent("404", NotFoundPage),
});

// pathless layout so every page waits for auth and the user data download
const userDataRoute = createRoute({
  getParentRoute: () => root,
  id: "userData",
  // explicit return type: inferring it would make the route tree's type
  // depend on itself through `matches` (TS7022)
  beforeLoad: async ({ context, matches, preload }): Promise<void> =>
    waitForUserData(context.auth, matches, preload),
  // the router renders a pending route only through its pending component
  // (the router's default) - shown at once, else nothing renders on first
  // load, not even the page switcher
  pendingMs: 0,
  pendingMinMs: 0,
});

const test = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/",
  staticData: { page: "test" },
  component: routePage(TestPage, {
    class: "full-width content-grid",
  }),
});

const verify = createRoute({
  getParentRoute: () => userDataRoute,
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
  getParentRoute: () => userDataRoute,
  path: "/leaderboards",
  staticData: { page: "leaderboards" },
  component: routePage(LeaderboardPage),
  validateSearch: LeaderboardSearchSchema,
  // the loader reads the selection and page only: other search writes (eg.
  // dropping goToUserPage) don't re-run it
  loaderDeps: ({ search }) => ({
    type: search.type,
    mode: search.mode,
    mode2: search.mode2,
    language: search.language,
    yesterday: search.yesterday,
    lastWeek: search.lastWeek,
    friendsOnly: search.friendsOnly,
    page: search.page,
  }),
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
  // background data: start the fetches, the page shows its section loaders
  loader: ({ context: { queryClient, auth }, deps }) => {
    const selection = toSelection(deps);
    void queryClient.prefetchQuery(getServerConfigurationQueryOptions());
    void queryClient.prefetchQuery(
      getLeaderboardQueryOptions({ ...selection, page: (deps.page ?? 1) - 1 }),
    );
    if (auth.isSignedIn()) {
      void queryClient.prefetchQuery(getRankQueryOptions(selection));
    }
  },
});

const about = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/about",
  staticData: { page: "about" },
  component: routePage(AboutPage, { class: "full-width" }),
  // background data: start the fetches, the page shows its section loaders
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(getContributorsQueryOptions());
    void queryClient.prefetchQuery(getSupportersQueryOptions());
    void queryClient.prefetchQuery(getTypingStatsQueryOptions());
    void queryClient.prefetchQuery(getSpeedHistogramQueryOptions());
  },
});

const settings = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/settings",
  staticData: { page: "settings" },
  component: routePage(SettingsPage),
  validateSearch: SettingsSearchSchema,
});

const login = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/login",
  staticData: { page: "login" },
  component: routePage(LoginPage),
  beforeLoad: ({ context }) => guestOnly(context.auth),
  // background data: start the fetch, the page shows its section loaders
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(getServerConfigurationQueryOptions());
  },
});

const account = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/account",
  staticData: { page: "account", loadingStep: "results" },
  component: routePage(AccountPage),
  beforeLoad: ({ context }) => requireAuth(context.auth),
  // blocking data
  loader: async (loader) => {
    await runRouteLoadingStep(loader, async () => {
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
  getParentRoute: () => userDataRoute,
  path: "/account-settings",
  staticData: { page: "accountSettings" },
  component: routePage(AccountSettingsPage),
  validateSearch: AccountSettingsSearchSchema,
  beforeLoad: ({ context }) => requireAuth(context.auth),
});

const profileSearch = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/profile",
  staticData: { page: "profileSearch" },
  component: routePage(ProfileSearchPage),
});

const profile = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/profile/$uidOrName",
  staticData: { page: "profile" },
  component: routePage(ProfilePage),
  // background data: start the fetch, the page shows its section loaders
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(getUserProfile(params.uidOrName));
  },
});

const friends = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/friends",
  staticData: { page: "friends", loadingStep: "friends" },
  component: routePage(FriendsPage),
  beforeLoad: ({ context }) => requireAuth(context.auth),
  // blocking data
  loader: async (loader) => {
    await runRouteLoadingStep(loader, async () => {
      await Promise.all([
        loader.context.queryClient.ensureQueryData(
          getServerConfigurationQueryOptions(),
        ),
        waitForConnectionsReady(),
      ]);
    });
    // refetched on every visit (not on a hover: no global side effects)
    if (!loader.preload) await invalidateConnections();
  },
});

export const routeTree = root.addChildren([
  userDataRoute.addChildren([
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
