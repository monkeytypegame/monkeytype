/**
 * App-shell test harness: the real route tree in a real RouterProvider (via
 * AppShell), with in-memory history, a test router context (fake auth, test
 * query client), stub pages and page fades completed by the harness.
 *
 * Its vi.mock calls stub the pages and animejs for modules loaded after it.
 * oxfmt sorts imports, so a test file should not import src modules that load
 * pages or anime (eg. Pages, AppShell) itself - get them through the harness.
 * Lighter src imports (query options...) are fine.
 *
 * ```tsx
 * afterEach(() => cleanupApp());
 *
 * it("redirects to login", async () => {
 *   const app = renderApp({ url: "/account", auth: "signedOut" });
 *   await app.settle(); // router idle, all page fades finished
 *   expect(app.url()).toBe("/login");
 *   expect(app.shownPage()).toBe("login");
 * });
 * ```
 *
 * - `auth`: "signedIn" | "signedOut" | "pending" (first auth state not known
 *   yet). Change it with `app.auth.signIn()` / `signOut()`; the first call on a
 *   pending auth resolves the first auth state. `signIn({ userData })` hands
 *   the app route a user data download to wait for.
 * - `queryData`: seeds the test query client. `queryResponses`: replaces the
 *   app's query functions by query key - pair with `deferred()` to settle a
 *   response mid-test. `app.queryClient` for anything else.
 * - `app.navigate(...)` is the typed router.navigate, `app.router` the router.
 * - Pages are stubs rendering their name; `shownPage()` returns the name of the
 *   page on screen (eg. "loading", "login", "404").
 * - Fades: `settle()` finishes them all. For fade ordering use
 *   `runningFades()` / `finishFade()` (finishes the oldest running fade).
 */
// static json (layouts...) read from disk, the test state module loads some
import "./mock-static";
import { cleanup, render } from "@solidjs/testing-library";
import { hashKey, QueryClient, QueryKey } from "@tanstack/solid-query";
import { createMemoryHistory } from "@tanstack/solid-router";
import { vi } from "vitest";

import type { RouterAuth } from "../../src/ts/router/context";

import { AppShell } from "../../src/ts/components/AppShell";
import { AppRouter, createAppRouter } from "../../src/ts/router/create-router";
import { setRouter } from "../../src/ts/router/navigate";
import { resetLoadingPage } from "../../src/ts/states/loading-page";

export type Fade = { el: HTMLElement; opacity: number; complete: () => void };

const { fades } = vi.hoisted(() => ({ fades: [] as Fade[] }));

vi.mock("animejs", () => ({
  animate: (
    el: HTMLElement,
    params: { opacity: number; duration: number; onComplete?: () => void },
  ) => {
    // initial styles are applied with a zero duration animation
    if (params.duration !== 0) {
      const fade: Fade = {
        el,
        opacity: params.opacity,
        complete: () => {
          fades.splice(fades.indexOf(fade), 1);
          params.onComplete?.();
        },
      };
      fades.push(fade);
    }
    return { pause: vi.fn(), then: vi.fn() };
  },
}));

function stubPage(name: string): () => Record<string, () => string> {
  return () => ({ [name]: () => name });
}
vi.mock("../../src/ts/components/pages/404Page", stubPage("NotFoundPage"));
vi.mock("../../src/ts/components/pages/AboutPage", stubPage("AboutPage"));
vi.mock(
  "../../src/ts/components/pages/account-settings/AccountSettingsPage",
  stubPage("AccountSettingsPage"),
);
vi.mock(
  "../../src/ts/components/pages/account/AccountPage",
  stubPage("AccountPage"),
);
vi.mock(
  "../../src/ts/components/pages/connections/FriendsPage",
  stubPage("FriendsPage"),
);
vi.mock(
  "../../src/ts/components/pages/leaderboard/LeaderboardPage",
  stubPage("LeaderboardPage"),
);
vi.mock("../../src/ts/components/pages/LoadingPage", stubPage("LoadingPage"));
vi.mock("../../src/ts/components/pages/login/LoginPage", stubPage("LoginPage"));
vi.mock(
  "../../src/ts/components/pages/profile/ProfilePage",
  stubPage("ProfilePage"),
);
vi.mock(
  "../../src/ts/components/pages/profile/ProfileSearchPage",
  stubPage("ProfileSearchPage"),
);
vi.mock(
  "../../src/ts/components/pages/settings/SettingsPage",
  stubPage("SettingsPage"),
);
vi.mock("../../src/ts/components/pages/test/TestPage", stubPage("TestPage"));

export type FakeAuthState = "signedIn" | "signedOut" | "pending";

export type FakeAuth = RouterAuth & {
  /** Resolves the first auth state if pending, else notifies the router. */
  signIn: (options?: { userData?: Promise<void> }) => void;
  signOut: () => void;
};

export function createFakeAuth(
  initial: FakeAuthState,
  options: { available?: boolean } = {},
): FakeAuth {
  let isSignedIn = initial === "signedIn";
  let isFirstStateKnown = initial !== "pending";
  let userData: Promise<void> | undefined;
  let resolveFirstState: () => void = () => undefined;
  const firstState = isFirstStateKnown
    ? Promise.resolve()
    : new Promise<void>((resolve) => (resolveFirstState = resolve));
  const listeners = new Set<() => void>();

  function setSignedIn(signedIn: boolean): void {
    isSignedIn = signedIn;
    if (!isFirstStateKnown) {
      isFirstStateKnown = true;
      resolveFirstState();
      return;
    }
    for (const listener of listeners) listener();
  }

  return {
    isAvailable: () => options.available ?? true,
    isSignedIn: () => isSignedIn,
    waitForFirstState: async () => firstState,
    takeUserDataDownload: (): Promise<void> | undefined => {
      const download = userData;
      userData = undefined;
      return download;
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    signIn: (signInOptions) => {
      userData = signInOptions?.userData;
      setSignedIn(true);
    },
    signOut: () => setSignedIn(false),
  };
}

/**
 * Query client whose responses tests control: `respond(queryKey, fetch)`
 * replaces the query function of every query with that key - including the
 * one passed by the app (eg. in `ensureQueryData`). Nothing is retried.
 */
export type TestQueryClient = QueryClient & {
  respond: (queryKey: QueryKey, fetch: () => Promise<unknown>) => void;
};

export function createTestQueryClient(): TestQueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const responses = new Map<string, () => Promise<unknown>>();

  // every query read or fetch goes through here, so a response replaces the
  // app's own query function
  type Defaulted = { queryHash: string; queryFn?: unknown };
  const defaultQueryOptions = client.defaultQueryOptions.bind(client) as (
    options: unknown,
  ) => Defaulted;
  const withResponse = (options: unknown): Defaulted => {
    const defaulted = defaultQueryOptions(options);
    const response = responses.get(defaulted.queryHash);
    if (response !== undefined) defaulted.queryFn = response;
    return defaulted;
  };
  client.defaultQueryOptions =
    withResponse as unknown as QueryClient["defaultQueryOptions"];

  return Object.assign(client, {
    respond: (queryKey: QueryKey, fetch: () => Promise<unknown>) => {
      responses.set(hashKey(queryKey), fetch);
    },
  });
}

/** A promise with its resolve and reject exposed, for responses a test settles. */
export function deferred<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export type RenderAppOptions = {
  /** Initial url (path, search and hash). Default "/". */
  url?: string;
  /** Default "signedOut". */
  auth?: FakeAuthState;
  /** False to simulate auth failing to load. */
  authAvailable?: boolean;
  /** Cached query data, as if already fetched. */
  queryData?: [QueryKey, unknown][];
  /** Query functions replacing the app's, by query key (see createTestQueryClient). */
  queryResponses?: [QueryKey, () => Promise<unknown>][];
};

export type App = {
  router: AppRouter;
  auth: FakeAuth;
  queryClient: TestQueryClient;
  container: HTMLElement;
  navigate: AppRouter["navigate"];
  /** Current url: path, search and hash. */
  url: () => string;
  /** Name of the page in the DOM, eg. "login" (undefined if none). */
  shownPage: () => string | undefined;
  /** Waits for the router to be idle and finishes all page fades. */
  settle: () => Promise<void>;
  runningFades: () => readonly Fade[];
  /** Finishes the oldest running fade, returns its target opacity. */
  finishFade: () => number;
};

export function renderApp(options: RenderAppOptions = {}): App {
  const auth = createFakeAuth(options.auth ?? "signedOut", {
    available: options.authAvailable,
  });
  const queryClient = createTestQueryClient();
  for (const [key, data] of options.queryData ?? []) {
    queryClient.setQueryData(key, data);
  }
  for (const [key, fetch] of options.queryResponses ?? []) {
    queryClient.respond(key, fetch);
  }
  // the router resets scroll on navigation, jsdom doesn't implement it
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

  const router = createAppRouter(
    { auth, queryClient },
    { history: createMemoryHistory({ initialEntries: [options.url ?? "/"] }) },
  );
  // vanilla modules (and <Pages>) read the router through this holder
  setRouter(router);

  const { container } = render(() => <AppShell router={router} />);

  function finishFade(): number {
    const fade = fades[0];
    if (fade === undefined) throw new Error("no fade running");
    fade.complete();
    return fade.opacity;
  }

  async function settle(): Promise<void> {
    // a finished fade can start another, and a resolved route can start a fade
    for (let i = 0; i < 100; i++) {
      await vi.waitFor(() => {
        if (router.state.status !== "idle" || router.state.isLoading) {
          throw new Error("router busy");
        }
      });
      await flushMicrotasks();
      if (fades.length === 0) return;
      while (fades.length > 0) finishFade();
    }
    throw new Error("app did not settle");
  }

  return {
    router,
    auth,
    queryClient,
    container,
    navigate: router.navigate,
    url: () => {
      const { pathname, searchStr, hash } = router.state.location;
      return pathname + searchStr + (hash === "" ? "" : `#${hash}`);
    },
    shownPage: () => {
      const id = container.querySelector(".page")?.id;
      if (id === undefined) return undefined;
      const name = id.replace(/^page/, "");
      return name.charAt(0).toLowerCase() + name.slice(1);
    },
    settle,
    runningFades: () => fades,
    finishFade,
  };
}

/** Unmounts the app and resets shared state. Call in afterEach. */
export function cleanupApp(): void {
  cleanup();
  fades.length = 0;
  setRouter(undefined);
  resetLoadingPage();
}

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
