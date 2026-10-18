// The route tree: every page with its guards and loaders

import type { QueryClient } from "@tanstack/solid-query";
import {
  createRootRouteWithContext,
  createRoute,
  redirect,
  type StaticDataRouteOption,
} from "@tanstack/solid-router";

import {
  invalidateConnections,
  isConnectionsReady,
  waitForConnectionsReady,
} from "../collections/connections";
import { isResultsReady, waitForResultsReady } from "../collections/results";
import { PageSwitcher } from "../components/core/PageSwitcher";
import { AboutPage } from "../components/pages/AboutPage";
import { AccountSettingsPage } from "../components/pages/account-settings/AccountSettingsPage";
import { AccountPage } from "../components/pages/account/AccountPage";
import { FriendsPage } from "../components/pages/connections/FriendsPage";
import { LeaderboardPage } from "../components/pages/leaderboard/LeaderboardPage";
import { LoginPage } from "../components/pages/login/LoginPage";
import { createRouterPage } from "../components/core/Page";
import { ProfilePage } from "../components/pages/profile/ProfilePage";
import { ProfileSearchPage } from "../components/pages/profile/ProfileSearchPage";
import { SettingsPage } from "../components/pages/settings/SettingsPage";
import { TestPage } from "../components/pages/test/TestPage";
import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
} from "../queries/leaderboards";
import { getUserProfile } from "../queries/profile";
import {
  getContributorsQueryOptions,
  getSpeedHistogramQueryOptions,
  getSupportersQueryOptions,
  getTypingStatsQueryOptions,
} from "../queries/public";
import { getServerConfigurationQueryOptions } from "../queries/server-configuration";
import { AccountSettingsSearchSchema } from "../states/account-settings";
import {
  getMissingLeaderboardSearch,
  LeaderboardSearchSchema,
  toSelection,
} from "../states/leaderboard-selection";
import { SettingsSearchSchema } from "../states/settings-highlight";
import { getSnapshot } from "../states/snapshot";
import * as TodayTracker from "../test/today-tracker";
import type { RouterAuth } from "./create-router-auth";
import {
  type LoadingStep,
  planLoadingBar,
  runLoadingStep,
} from "./loading-bar";

// NOTE: whenever adding a route add the pathname to the `firebase.json` rewrite rule

/** A page of the site, rendered by its route (see `staticData.page`). */
export type PageName =
  | "loading"
  | "test"
  | "about"
  | "settings"
  | "account"
  | "login"
  | "profile"
  | "profileSearch"
  | "404"
  | "accountSettings"
  | "friends"
  | "leaderboards";

declare module "@tanstack/solid-router" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation needs an interface
  interface StaticDataRouteOption {
    /** The page the route renders (its component is a `createRouterPage`). */
    page?: PageName;
    /** The route's loading step: its loader runs it with runRouteLoadingStep */
    loadingPage?: RouteLoadingStep;
  }
}

/**
 * A route's loading step, set in its `staticData.loadingPage`: its bar setup
 * and whether it has to run right now. Labelled after the route's page.
 */
type RouteLoadingStep = Omit<LoadingStep, "label"> & {
  /** Read when the navigation starts (to plan the bar) and again when the step runs. */
  isNeeded: () => boolean;
};

const userDataStep: LoadingStep = {
  label: "user data",
  keyframes: [
    { percentage: 90, durationMs: 1000, text: "Downloading user data..." },
  ],
};

/** Router context: guards and loaders read these instead of module globals. */
export type RouterContext = {
  auth: RouterAuth;
  queryClient: QueryClient;
};

/**
 * Waits until the auth state is known, plans the navigation's loading bar
 * (the user data step if a download is pending, plus each matched route's
 * step that is needed right now), then shows it while the user data
 * downloads (only once per sign in). `matches` are all routes of the
 * navigation. A preload (hovered link) only waits for the auth state.
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
  const routeSteps = matches.filter(
    (match) => match.staticData.loadingPage?.isNeeded() ?? false,
  ).length;
  planLoadingBar((userData === undefined ? 0 : 1) + routeSteps);
  if (userData === undefined) return;

  await runLoadingStep(userDataStep, async () => userData);
}

/** The parts of a loader's context running its route's loading step needs. */
type LoadingStepLoaderContext = {
  preload: boolean;
  route: { options: { staticData?: StaticDataRouteOption } };
};

/**
 * Runs `load` as the loading step the loader's route sets in
 * `staticData.loadingPage`, unless it's no longer needed. A preload (hovered
 * link) runs nothing: no loading page, the step runs once the page is opened.
 */
async function runRouteLoadingStep(
  loader: LoadingStepLoaderContext,
  load: () => Promise<void>,
): Promise<void> {
  if (loader.preload) return;
  const { loadingPage: step, page } = loader.route.options.staticData ?? {};
  if (step === undefined || page === undefined) {
    throw new Error(
      "A route running a loading step needs staticData.loadingPage and staticData.page",
    );
  }
  if (!step.isNeeded()) return;
  await runLoadingStep({ ...step, label: `the ${page} page` }, load);
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
});

// pathless layout so every page waits for auth and the user data download
const userDataRoute = createRoute({
  getParentRoute: () => root,
  id: "userData",
  // explicit return type: inferring it would make the route tree's type
  // depend on itself through `matches` (TS7022)
  beforeLoad: async ({ context, matches, preload }): Promise<void> =>
    waitForUserData(context.auth, matches, preload),
  // pending at once: the router only presents a pending route after
  // pendingMs, so on first load nothing would render (not even the page
  // switcher's loading page) until then
  pendingMs: 0,
  pendingMinMs: 0,
});

const test = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/",
  staticData: { page: "test" },
  component: createRouterPage(TestPage),
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
  component: createRouterPage(LeaderboardPage),
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
  component: createRouterPage(AboutPage),
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
  component: createRouterPage(SettingsPage),
  validateSearch: SettingsSearchSchema,
});

const login = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/login",
  staticData: { page: "login" },
  component: createRouterPage(LoginPage),
  beforeLoad: ({ context }) => guestOnly(context.auth),
  // background data: start the fetch, the page shows its section loaders
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(getServerConfigurationQueryOptions());
  },
});

const account = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/account",
  staticData: {
    page: "account",
    loadingPage: {
      isNeeded: () => !isResultsReady(),
      keyframes: [
        { percentage: 90, durationMs: 2000, text: "Downloading results..." },
      ],
    },
  },
  component: createRouterPage(AccountPage),
  beforeLoad: ({ context }) => requireAuth(context.auth),
  // blocking data
  loader: async (loader) => {
    // a hover starts the download early, without the loading page. Nothing
    // else starts it: the collection downloads once something reads it
    if (loader.preload) {
      waitForResultsReady().catch(() => undefined);
      return;
    }
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
  component: createRouterPage(AccountSettingsPage),
  validateSearch: AccountSettingsSearchSchema,
  beforeLoad: ({ context }) => requireAuth(context.auth),
});

const profileSearch = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/profile",
  staticData: { page: "profileSearch" },
  component: createRouterPage(ProfileSearchPage),
});

const profile = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/profile/$uidOrName",
  staticData: { page: "profile" },
  component: createRouterPage(ProfilePage),
  // background data: start the fetch, the page shows its section loaders
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(getUserProfile(params.uidOrName));
  },
});

const friends = createRoute({
  getParentRoute: () => userDataRoute,
  path: "/friends",
  staticData: {
    page: "friends",
    loadingPage: {
      isNeeded: () => !isConnectionsReady(),
      keyframes: [
        { percentage: 50, durationMs: 1500, text: "Downloading friends..." },
        {
          percentage: 50,
          durationMs: 1500,
          text: "Downloading friend requests...",
        },
      ],
    },
  },
  component: createRouterPage(FriendsPage),
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
