import {
  createRootRouteWithContext,
  createRoute,
  redirect,
} from "@tanstack/solid-router";

import {
  invalidateConnections,
  isConnectionsReady,
  waitForConnectionsReady,
} from "../collections/connections";
import { isResultsReady, waitForResultsReady } from "../collections/results";
import { NotFoundPage } from "../components/pages/404Page";
import { AboutPage } from "../components/pages/AboutPage";
import { AccountSettingsPage } from "../components/pages/account-settings/AccountSettingsPage";
import { AccountPage } from "../components/pages/account/AccountPage";
import { FriendsPage } from "../components/pages/connections/FriendsPage";
import { LeaderboardPage } from "../components/pages/leaderboard/LeaderboardPage";
import { LoginPage } from "../components/pages/login/LoginPage";
import { LoadingRoutePage, pageComponent } from "../components/pages/Page";
import { ProfilePage } from "../components/pages/profile/ProfilePage";
import { ProfileSearchPage } from "../components/pages/profile/ProfileSearchPage";
import { SettingsPage } from "../components/pages/settings/SettingsPage";
import { TestPage } from "../components/pages/test/TestPage";
import { RootLayout } from "../components/RootLayout";
import { getSnapshot } from "../db";
import { accountSettingsSearch } from "../states/account-settings";
import { getServerConfigurationQueryOptions } from "../queries/server-configuration";
import { setSelectedProfileName } from "../states/core";
import { leaderboardSearch } from "../states/leaderboard-selection";
import { withLoading } from "../states/loading-page";
import { settingsSearch } from "../states/settings-search";
import * as TodayTracker from "../test/today-tracker";
import type { RouterAuth, RouterContext } from "./context";
import { readSearchOnEnter } from "./search-params";

// NOTE: whenever adding a route add the pathname to the `firebase.json` rewrite rule

/**
 * Waits until the auth state is known, then shows the loading bar while the
 * user data downloads (only once per sign in).
 */
async function waitForUserData(auth: RouterAuth): Promise<void> {
  await auth.waitForFirstState();

  const userData = auth.takeUserDataDownload();
  if (userData === undefined) return;

  await withLoading("user data", {
    style: "bar",
    load: async () => userData,
    keyframes: [
      { percentage: 90, durationMs: 1000, text: "Downloading user data..." },
    ],
  });
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
});

// pathless layout so every page waits for auth and the user data download
const app = createRoute({
  getParentRoute: () => root,
  id: "app",
  beforeLoad: async ({ context }) => waitForUserData(context.auth),
  // the router renders a pending route only through its pendingComponent -
  // without one nothing renders on first load, not even the root layout
  pendingComponent: LoadingRoutePage,
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
  beforeLoad: readSearchOnEnter(leaderboardSearch),
  loader: async ({ context: { queryClient } }) => {
    const serverConfiguration = getServerConfigurationQueryOptions();
    if (queryClient.getQueryData(serverConfiguration.queryKey) !== undefined) {
      return;
    }
    await withLoading("the leaderboards page", {
      style: "spinner",
      load: async () => {
        await queryClient.ensureQueryData(serverConfiguration);
      },
    });
  },
});

const about = createRoute({
  getParentRoute: () => app,
  path: "/about",
  component: pageComponent("about", AboutPage, { class: "full-width" }),
});

const settings = createRoute({
  getParentRoute: () => app,
  path: "/settings",
  component: pageComponent("settings", SettingsPage),
  beforeLoad: readSearchOnEnter(settingsSearch),
});

const login = createRoute({
  getParentRoute: () => app,
  path: "/login",
  component: pageComponent("login", LoginPage),
  beforeLoad: ({ context }) => guestOnly(context.auth),
});

const account = createRoute({
  getParentRoute: () => app,
  path: "/account",
  component: pageComponent("account", AccountPage),
  beforeLoad: ({ context }) => requireAuth(context.auth),
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
  component: pageComponent("accountSettings", AccountSettingsPage),
  beforeLoad: (ctx) => {
    requireAuth(ctx.context.auth);
    readSearchOnEnter(accountSettingsSearch)(ctx);
  },
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
  beforeLoad: ({ params }) => {
    setSelectedProfileName(params.uidOrName);
  },
});

const friends = createRoute({
  getParentRoute: () => app,
  path: "/friends",
  component: pageComponent("friends", FriendsPage),
  beforeLoad: ({ context }) => requireAuth(context.auth),
  loader: async ({ context: { queryClient } }) => {
    if (!isConnectionsReady()) {
      await withLoading("the friends page", {
        style: "bar",
        load: async () => {
          await Promise.all([
            queryClient.ensureQueryData(getServerConfigurationQueryOptions()),
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
  component: pageComponent("404", NotFoundPage),
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
