/**
 * App-shell test harness: the real route tree in a real RouterProvider,
 * with in-memory history, a test router context (fake auth, test
 * query client), stub pages and animations that finish at once.
 *
 * Its vi.mock calls stub the pages and animejs for modules loaded after it.
 * oxfmt sorts imports, so a test file should not import src modules that load
 * pages or anime (eg. routes, PageSwitcher) itself - get them through
 * the harness.
 * Lighter src imports (query options...) are fine.
 *
 * ```tsx
 * afterEach(() => cleanupApp());
 *
 * it("redirects to login", async () => {
 *   const app = renderApp({ url: "/account", auth: "signedOut" });
 *   await app.settle(); // router idle, page swapped
 *   expect(app.url()).toBe("/login");
 *   expect(app.shownPage()).toBe("login");
 * });
 * ```
 *
 * - `auth`: "signedIn" | "signedOut" | "pending" (first auth state not known
 *   yet). Change it with `app.auth.signIn()` / `signOut()`; the first call on a
 *   pending auth resolves the first auth state. `signIn({ userData })` hands
 *   the userData route a user data download to wait for (a function: called per
 *   download, so a Retry after a failure gets a new one).
 * - `queryData`: seeds the test query client. `queryResponses`: replaces the
 *   app's query functions by query key - pair with `deferred()` to settle a
 *   response mid-test. `app.queryClient` for anything else.
 * - `app.navigate(...)` is the typed router.navigate, `app.router` the router.
 *   It resolves once the navigation loaded: don't await it while a load
 *   waits for the test.
 * - `loadingBar()` reads the loading page's bar (fill width, text). The fill
 *   jumps straight to each target. `loadingIndicator()`: spinner, bar or error.
 * - Blocking downloads (`results`, `friends`: "pending"): real query
 *   collections (the app's retry options) fetching from a fake server.
 *   `app.blockingData.loadResults()` / `failResults(error)` (fails the fetch
 *   and its retries, like a down server; a new fetch, eg. Retry, waits again),
 *   `requests(download)` counts the requests sent.
 * - Slow navigations (pending spinner): `friendsRefresh: "pending"` hangs the
 *   friends page's refetch (not a loading step) until
 *   `app.blockingData.refreshFriends()`.
 * - Tests can run on fake timers (app-shell.spec.tsx does, for all tests):
 *   `vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date",
 *   "requestAnimationFrame", "cancelAnimationFrame"] })`. `flush()`, `hover()`
 *   and `settle()` work with real or fake timers. On fake timers `settle()`
 *   moves the clock itself until the router is idle and the bar is gone (eg.
 *   the pending min, the bar's 125ms "Done" fill); other waits advance it
 *   with `vi.advanceTimersByTimeAsync`.
 * - Pages are stubs rendering their name, except the real loading page (its
 *   text, bar, error and Retry button); `shownPage()` returns the name of the
 *   page on screen (eg. "loading", "login", "404"), `pagesInDom()` all of
 *   them, `pageElement()` its wrapper. `pageMounts()` records each page
 *   content mount and whether it was attached to the document by then.
 *   `pageContent` adds content to a stub, eg. a probe calling the page's
 *   search hook.
 * - Links outside the pages, like the header's: `app.hover(link)` (waits for
 *   its preload), `app.click(link)`. `history: "browser"` for back/forward
 *   (`app.router.history.back()`), which the history blocker guards only on
 *   the browser history.
 * - Animations (page fades, the bar fill) finish as soon as they start: the
 *   tests check which page shows, the fades themselves are tested with the
 *   anime components. `flush()` runs timers and one animation frame (an
 *   enter animation starts on a frame).
 */
// static json (layouts...) read from disk, the test state module loads some
import "./mock-static";
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/solid-db";
import {
  hashKey,
  QueryClient,
  QueryClientProvider,
  QueryKey,
} from "@tanstack/solid-query";
import {
  createBrowserHistory,
  createMemoryHistory,
  Link,
  NavigateOptions,
  RouterContextProvider,
  RouterHistory,
  RouterProvider,
} from "@tanstack/solid-router";
import { createSignal, For, JSXElement } from "solid-js";
import { vi } from "vitest";

import { __testing as userTesting } from "../../src/ts/collections/user";
import { blockingDownloadOptions } from "../../src/ts/collections/utils/blocking-download";
import { __testing as configTesting } from "../../src/ts/config/testing";
import { getDefaultSnapshot } from "../../src/ts/constants/default-snapshot";
import {
  AppRouter,
  createAppRouter,
  setPreloading,
} from "../../src/ts/router/create-router";
import {
  createRouterAuth,
  type RouterAuth,
  type UserDataDownload,
} from "../../src/ts/router/create-router-auth";
import { setRouter } from "../../src/ts/router/instance";
import { resetLoadingBar } from "../../src/ts/router/loading-bar";
import { isLoadingBarShown } from "../../src/ts/states/loading-page";
import {
  isTestActive,
  setIsTestRestarting,
  setResultCalculating,
  setTestActive,
} from "../../src/ts/states/test";
import { canStartTest } from "../../src/ts/test/test-page-state";

/** A page's content mounting, and whether it was in the document by then. */
export type PageMount = { page: string; attached: boolean };

const { pageMounts, pageContent, blockingData } = vi.hoisted(() => {
  type Waiting = { resolve: () => void; reject: (error: Error) => void };
  // the friends page's refetch on every visit, ready by default
  function readiness(): {
    ready: boolean;
    set: (ready: boolean) => void;
    wait: () => Promise<void>;
  } {
    const waiting: Waiting[] = [];
    const state = {
      ready: true,
      set: (ready: boolean) => {
        state.ready = ready;
        if (!ready) return;
        for (const { resolve } of waiting.splice(0)) resolve();
      },
      wait: async () => {
        if (state.ready) return;
        return new Promise<void>((resolve, reject) =>
          waiting.push({ resolve, reject }),
        );
      },
    };
    return state;
  }
  /**
   * The server side of a blocking download (results, friends), ready by
   * default. A real query collection (made by renderApp) fetches from it.
   */
  function server(): {
    ready: boolean;
    /** Requests received (fetch attempts, retries included). */
    requests: number;
    /** The collection downloading from this server, set by renderApp. */
    collection: DownloadCollection | undefined;
    set: (ready: boolean) => void;
    /** Fails the running fetch, its retries included. A new fetch waits again. */
    fail: (error: Error) => void;
    /** The query function, `failures`: the fetch's failed attempts so far. */
    fetch: (failures: number) => Promise<{ _id: string }[]>;
  } {
    const waiting: Waiting[] = [];
    let failure: Error | undefined;
    const state = {
      ready: true,
      requests: 0,
      collection: undefined as DownloadCollection | undefined,
      set: (ready: boolean) => {
        state.ready = ready;
        failure = undefined;
        if (!ready) return;
        for (const { resolve } of waiting.splice(0)) resolve();
      },
      fail: (error: Error) => {
        failure = error;
        for (const { reject } of waiting.splice(0)) reject(error);
      },
      fetch: async (failures: number) => {
        state.requests++;
        if (failures === 0) failure = undefined;
        // a retry of the failing fetch
        if (failure !== undefined) return Promise.reject(failure);
        if (!state.ready) {
          await new Promise<void>((resolve, reject) =>
            waiting.push({ resolve, reject }),
          );
        }
        return [];
      },
    };
    return state;
  }
  return {
    pageMounts: [] as PageMount[],
    pageContent: new Map<string, () => JSXElement>(),
    blockingData: {
      results: server(),
      friends: server(),
      friendsRefresh: readiness(),
    },
  };
});

function downloadCollection(name: "results" | "friends"): DownloadCollection {
  const collection = blockingData[name].collection;
  if (collection === undefined) throw new Error("app not rendered");
  return collection;
}

// results and friends are collections synced outside the router context: the
// harness swaps them for collections downloading from its fake server
vi.mock(import("../../src/ts/collections/results"), async (importOriginal) => {
  const { isDownloaded, waitForDownload } =
    await import("../../src/ts/collections/utils/blocking-download");
  return {
    ...(await importOriginal()),
    isResultsReady: () => isDownloaded(downloadCollection("results")),
    waitForResultsReady: async () =>
      waitForDownload(downloadCollection("results")),
  };
});
vi.mock(
  import("../../src/ts/collections/connections"),
  async (importOriginal) => {
    const { isDownloaded, waitForDownload } =
      await import("../../src/ts/collections/utils/blocking-download");
    return {
      ...(await importOriginal()),
      isConnectionsReady: () => isDownloaded(downloadCollection("friends")),
      waitForConnectionsReady: async () =>
        waitForDownload(downloadCollection("friends")),
      // the friends page refetches its connections on every visit
      invalidateConnections: blockingData.friendsRefresh.wait,
    };
  },
);

// animations finish as soon as they start
vi.mock("animejs", () => ({
  animate: (
    el: HTMLElement,
    params: { opacity?: number; width?: string; onComplete?: () => void },
  ) => {
    if (params.opacity !== undefined) {
      el.style.opacity = String(params.opacity);
    }
    if (params.width !== undefined) el.style.width = params.width;
    params.onComplete?.();
    // anime's animations are thenable: Anime waits on them (eg. an exit)
    return {
      pause: vi.fn(),
      then: async (callback: () => void): Promise<void> => callback(),
    };
  },
}));

// stub pages render their name (plus any pageContent) and record whether
// they mounted attached
function stubPage(
  name: string,
): () => Promise<Record<string, () => JSXElement>> {
  return async () => {
    const { onMount } = await import("solid-js");
    const page = name.replace(/Page$/, "");
    return {
      [name]: () => {
        const el = document.createElement("span");
        el.textContent = name;
        onMount(() => pageMounts.push({ page, attached: el.isConnected }));
        return [el, pageContent.get(name)?.()];
      },
    };
  };
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

// the real test logic pulls in the whole typing test (indexedDB, layouts...).
// Leaving the test page just ends the test here: tests start a test (app.test),
// then check whether it is still running
vi.mock("../../src/ts/test/test-logic", async () => {
  const { setTestActive } = await import("../../src/ts/states/test");
  return {
    leaveTestPage: () => setTestActive(false),
    // the debug handle exposes it
    restartTest: () => undefined,
  };
});

export type FakeAuthState = "signedIn" | "signedOut" | "pending";

export type FakeAuth = RouterAuth & {
  /**
   * Resolves the first auth state if pending, else notifies the router.
   * `userData`: the user data download routes wait for - a function is
   * called for each download (the first, then each retry after a failure).
   */
  signIn: (options?: {
    userData?: Promise<void> | (() => Promise<void>);
  }) => void;
  signOut: () => void;
};

export function createFakeAuth(
  initial: FakeAuthState,
  options: { available?: boolean } = {},
): FakeAuth {
  let isSignedIn = initial === "signedIn";
  const auth = createRouterAuth({
    isAvailable: () => options.available ?? true,
    isSignedIn: () => isSignedIn,
  });
  if (initial !== "pending") auth.stateChanged();

  function setSignedIn(signedIn: boolean, userData?: UserDataDownload): void {
    isSignedIn = signedIn;
    // the account route checks the user data downloaded
    userTesting.setUser(signedIn ? getDefaultSnapshot() : undefined);
    auth.stateChanged(userData);
  }

  return {
    ...auth,
    signIn: (signInOptions) => {
      const download = signInOptions?.userData;
      setSignedIn(
        true,
        download === undefined
          ? undefined
          : typeof download === "function"
            ? { download: download(), redownload: download }
            : { download, redownload: async () => download },
      );
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
  /** Account results download. Default "ready". */
  results?: "ready" | "pending";
  /** Friends download. Default "ready". */
  friends?: "ready" | "pending";
  /**
   * The friends refetch on every visit of the friends page, not a loading
   * step: "pending" makes a navigation to friends unexpectedly slow.
   * Default "ready".
   */
  friendsRefresh?: "ready" | "pending";
  /**
   * Extra content for stub pages by component name (eg. `LeaderboardPage`),
   * rendered inside the page - for probes using the page's hooks.
   */
  pageContent?: Record<string, () => JSXElement>;
  /**
   * "browser" runs on jsdom's window history (back/forward through popstate,
   * which the history blocker guards; memory history doesn't block them).
   * Default "memory".
   */
  history?: "memory" | "browser";
};

/** What the loading page shows while (or instead of) loading. */
export type LoadingIndicator = "spinner" | "bar" | "error";

/** The loading page's bar as the user sees it. */
export type LoadingBar = { width: string; text: string };

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
  /** Names of all pages in the DOM, in document order. */
  pagesInDom: () => string[];
  /** The page wrapper element in the DOM (the first one if several). */
  pageElement: () => HTMLElement | null;
  /** Page contents mounted so far, oldest first (stub page names, eg. "About"). */
  pageMounts: () => readonly PageMount[];
  /**
   * Waits for the router to be idle and the page swap to finish.
   * `waitForRouter: false` only lets a navigation still loading show its
   * loading page.
   */
  settle: (options?: { waitForRouter?: boolean }) => Promise<void>;
  /** Finishes pending blocking data downloads (and the friends refetch). */
  blockingData: {
    loadResults: () => void;
    loadFriends: () => void;
    refreshFriends: () => void;
    /** Fails the results download, its retries too (a new download waits again). */
    failResults: (error: Error) => void;
    /** Fails the friends download, its retries too (a new download waits again). */
    failFriends: (error: Error) => void;
    /** Requests the download sent to the server so far (retries included). */
    requests: (download: "results" | "friends") => number;
  };
  /** The loading page's bar (fill width, text below it), undefined if not shown. */
  loadingBar: () => LoadingBar | undefined;
  /** What the loading page shows, undefined if no loading page is in the DOM. */
  loadingIndicator: () => LoadingIndicator | undefined;
  /** The typing test's state (the test page itself is a stub). */
  test: TestControls;
  /**
   * Hovers a link to `link` (rendered outside the pages, like the header's
   * nav) and waits for the preload it starts.
   */
  hover: <TTo extends string | undefined>(
    link: NavigateOptions<AppRouter, string, TTo>,
  ) => Promise<void>;
  /** Clicks a link to `link` (rendered outside the pages, like the header's nav). */
  click: <TTo extends string | undefined>(
    link: NavigateOptions<AppRouter, string, TTo>,
  ) => void;
};

/** Where a hovered or clicked link points (to, params, search). */
type HarnessLink = NavigateOptions<AppRouter, string, string | undefined>;

export type TestControls = {
  /** Starts a test, wherever the user is. */
  start: () => void;
  /** As if the user typed: starts a test if typing may start one now. */
  type: () => void;
  isRunning: () => boolean;
  setRestarting: (restarting: boolean) => void;
  setResultCalculating: (calculating: boolean) => void;
  /** Activates the no quit funbox. */
  enableNoQuit: () => void;
};

const testControls: TestControls = {
  start: () => setTestActive(true),
  // like the test's startTest
  type: () => {
    if (canStartTest()) setTestActive(true);
  },
  isRunning: () => isTestActive(),
  setRestarting: (restarting) => setIsTestRestarting(restarting),
  setResultCalculating: (calculating) => setResultCalculating(calculating),
  enableNoQuit: () => configTesting.replaceConfig({ funbox: ["no_quit"] }),
};

// stops the browser history listening to window popstate (see cleanupApp)
let destroyHistory: (() => void) | undefined;

function createHistory(options: RenderAppOptions): RouterHistory {
  const url = options.url ?? "/";
  if (options.history !== "browser") {
    return createMemoryHistory({ initialEntries: [url] });
  }
  window.history.replaceState(null, "", url);
  return createBrowserHistory();
}

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
  blockingData.results.set(options.results !== "pending");
  blockingData.friends.set(options.friends !== "pending");
  blockingData.results.requests = 0;
  blockingData.friends.requests = 0;
  blockingData.results.collection = createDownloadCollection("results");
  blockingData.friends.collection = createDownloadCollection("friends");
  blockingData.friendsRefresh.set(options.friendsRefresh !== "pending");
  // the account route checks the user data downloaded
  userTesting.setUser(
    options.auth === "signedIn" ? getDefaultSnapshot() : undefined,
  );
  for (const [name, content] of Object.entries(options.pageContent ?? {})) {
    pageContent.set(name, content);
  }
  // the router resets scroll on navigation, jsdom doesn't implement it
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

  const router = createAppRouter(
    { auth, queryClient },
    { history: createHistory(options) },
  );
  destroyHistory = () => router.history.destroy();
  // vanilla modules and router state memos read the router through this holder
  setRouter(router);

  // the header's links live in a separate solid root, like here
  const [links, setLinks] = createSignal<HarnessLink[]>([]);
  const { container } = render(() => (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <RouterContextProvider router={router}>
        {() => (
          <nav data-testid="harness-links">
            <For each={links()}>{(link) => <Link {...link}>link</Link>}</For>
          </nav>
        )}
      </RouterContextProvider>
    </QueryClientProvider>
  ));

  function renderLink(link: HarnessLink): Element {
    setLinks((prev) => [...prev, link]);
    const nav = container.querySelector('[data-testid="harness-links"]');
    const el = nav?.lastElementChild;
    if (el === null || el === undefined) throw new Error("link not rendered");
    return el;
  }

  async function hover<TTo extends string | undefined>(
    link: NavigateOptions<AppRouter, string, TTo>,
  ): Promise<void> {
    const el = renderLink(link as HarnessLink);
    fireEvent.mouseEnter(el);
    // intent preloads start after the preload delay
    const delay = (router.options.defaultPreloadDelay ?? 0) + 1;
    if (vi.isFakeTimers()) {
      await vi.advanceTimersByTimeAsync(delay);
    } else {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await flush();
  }

  async function settle({ waitForRouter = true } = {}): Promise<void> {
    const busy = (): string | undefined => {
      if (router.state.status !== "idle" || router.state.isLoading) {
        return "router busy";
      }
      // the loading bar filling up to "Done"
      if (isLoadingBarShown()) return "loading bar finishing";
      return undefined;
    };
    if (waitForRouter && vi.isFakeTimers()) {
      // moves the clock without sleeping: waits like the pending min or the
      // "Done" fill cost no real time
      for (let ms = 0; busy() !== undefined; ms += 5) {
        if (ms >= 5000) throw new Error(`settle timed out: ${busy()}`);
        await vi.advanceTimersByTimeAsync(5);
      }
    } else if (waitForRouter) {
      await vi.waitFor(
        () => {
          const reason = busy();
          if (reason !== undefined) throw new Error(reason);
        },
        { interval: 5 },
      );
    }
    // the page swap: the old page leaves, the new one is attached and its
    // content mounts on the next frame, its fade in starts on a frame
    for (let i = 0; i < 3; i++) await flush();
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
      const el = container.querySelector(".page");
      return el === null ? undefined : pageName(el);
    },
    pagesInDom: () => [...container.querySelectorAll(".page")].map(pageName),
    pageElement: () => container.querySelector<HTMLElement>(".page"),
    pageMounts: () => pageMounts,
    settle,
    blockingData: {
      loadResults: () => blockingData.results.set(true),
      loadFriends: () => blockingData.friends.set(true),
      refreshFriends: () => blockingData.friendsRefresh.set(true),
      failResults: (error) => blockingData.results.fail(error),
      failFriends: (error) => blockingData.friends.fail(error),
      requests: (download) => blockingData[download].requests,
    },
    loadingBar: () => {
      const page = container.querySelector("#pageLoading");
      const fill = page?.querySelector<HTMLElement>(".bg-main");
      const bar = fill?.parentElement;
      if (page === null || fill === null || fill === undefined) return;
      if (bar === null || bar === undefined) return;
      if (bar.classList.contains("hidden")) return undefined;
      return {
        width: fill.style.width,
        text: bar.nextElementSibling?.textContent ?? "",
      };
    },
    loadingIndicator: () => {
      const page = container.querySelector("#pageLoading");
      if (page === null) return undefined;
      // the spinner, error icon and bar are toggled, never removed
      const isShown = (icon: string): boolean =>
        page.querySelector(icon)?.closest(".hidden") === null;
      if (isShown(".fa-circle-notch")) return "spinner";
      if (isShown(".fa-times")) return "error";
      return "bar";
    },
    test: testControls,
    hover,
    click: (link) => {
      fireEvent.click(renderLink(link as HarnessLink));
    },
  };
}

/** Unmounts the app and resets shared state. Call in afterEach. */
export function cleanupApp(): void {
  cleanup();
  destroyHistory?.();
  destroyHistory = undefined;
  pageMounts.length = 0;
  pageContent.clear();
  setRouter(undefined);
  setPreloading(true);
  resetLoadingBar();
  setTestActive(false);
  setIsTestRestarting(false);
  setResultCalculating(false);
  configTesting.replaceConfig({});
  userTesting.setUser(undefined);
  for (const name of ["results", "friends"] as const) {
    void blockingData[name].collection?.cleanup();
    blockingData[name].collection = undefined;
  }
}

type DownloadCollection = ReturnType<typeof createDownloadCollection>;

/**
 * A real query collection (like the app's results and friends) downloading
 * from the harness server: already downloaded when the server is ready.
 * Else, like the app's, it starts downloading only once something reads it
 * (a loader, a hover's preload), not at sign in.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type
function createDownloadCollection(name: "results" | "friends") {
  const server = blockingData[name];
  const queryKey = ["harness", name];
  const queryClient = new QueryClient();
  if (server.ready) queryClient.setQueryData(queryKey, []);
  return createCollection(
    queryCollectionOptions({
      ...blockingDownloadOptions,
      retryDelay: 0,
      queryKey,
      queryClient,
      staleTime: Infinity,
      startSync: server.ready,
      getKey: (item) => item._id,
      queryFn: async () =>
        server.fetch(
          queryClient.getQueryState(queryKey)?.fetchFailureCount ?? 0,
        ),
    }),
  );
}

function pageName(el: Element): string {
  const name = el.id.replace(/^page/, "");
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Lets the app react: waits for pending timers and the next animation frame
 * (enter animations start on one). With fake timers this moves the clock by
 * one frame.
 */
export async function flush(): Promise<void> {
  if (vi.isFakeTimers()) {
    await vi.advanceTimersByTimeAsync(0);
    vi.advanceTimersToNextFrame();
    await vi.advanceTimersByTimeAsync(0);
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
