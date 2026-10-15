/**
 * App-shell test harness: the real route tree in a real RouterProvider,
 * with in-memory history, a test router context (fake auth, test
 * query client), stub pages and page fades completed by the harness.
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
 *   await app.settle(); // router idle, all page fades finished
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
 *   `app.blockingData.refreshFriends()`. Use fake timers (setTimeout,
 *   clearTimeout, Date, requestAnimationFrame, cancelAnimationFrame);
 *   `flush()` then moves the clock by one frame.
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
 * - Fades: `settle()` finishes them all. For fade ordering use
 *   `runningFades()` / `finishFade()` (finishes the oldest running fade) and
 *   `flush()` (timers and one animation frame - fade ins start on a frame).
 *   Like anime, a new fade on an element replaces its running one, which then
 *   never completes.
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

import type { RouterAuth } from "../../src/ts/router/create-router";

import { blockingDownloadOptions } from "../../src/ts/collections/utils/blocking-download";
import { __testing as configTesting } from "../../src/ts/config/testing";
import { getDefaultSnapshot } from "../../src/ts/constants/default-snapshot";
import { setSnapshot } from "../../src/ts/db";
import {
  AppRouter,
  createAppRouter,
  setPreloading,
} from "../../src/ts/router/create-router";
import {
  createRouterAuth,
  type UserDataDownload,
} from "../../src/ts/router/create-router-auth";
import { setRouter } from "../../src/ts/router/navigate";
import {
  isLoadingBarShown,
  resetLoadingPage,
} from "../../src/ts/states/loading-page";
import { canStartTest } from "../../src/ts/states/router";
import {
  isTestActive,
  setIsTestRestarting,
  setResultCalculating,
  setTestActive,
} from "../../src/ts/states/test";

export type Fade = { el: HTMLElement; opacity: number; complete: () => void };

/** A page's content mounting, and whether it was in the document by then. */
export type PageMount = { page: string; attached: boolean };

const { fades, pageMounts, pageContent, blockingData } = vi.hoisted(() => {
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
    fades: [] as Fade[],
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

vi.mock("animejs", () => ({
  animate: (
    el: HTMLElement,
    params: {
      opacity?: number;
      width?: string;
      duration: number;
      onComplete?: () => void;
    },
  ) => {
    // only page fades are tracked (not eg. the loading bar fill)
    if (params.opacity === undefined) {
      // the loading bar fill jumps to its target
      if (params.width !== undefined) el.style.width = params.width;
      params.onComplete?.();
      return { pause: vi.fn(), then: vi.fn() };
    }
    // like anime's default composition, a new animation replaces the running
    // one on the same element, which never completes
    const replaced = fades.findIndex((fade) => fade.el === el);
    if (replaced !== -1) fades.splice(replaced, 1);
    // initial styles and reduced motion use a zero duration animation
    if (params.duration === 0) {
      params.onComplete?.();
    } else {
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
    restart: () => undefined,
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
    setSnapshot(signedIn ? getDefaultSnapshot() : undefined, {
      dispatchEvent: false,
    });
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
   * Waits for the router to be idle and finishes all page fades.
   * `waitForRouter: false` finishes the fades of a navigation still loading.
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
  runningFades: () => readonly Fade[];
  /** Finishes the oldest running fade, returns its target opacity. */
  finishFade: () => number;
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
  setSnapshot(options.auth === "signedIn" ? getDefaultSnapshot() : undefined, {
    dispatchEvent: false,
  });
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
    await new Promise((resolve) =>
      setTimeout(resolve, (router.options.defaultPreloadDelay ?? 0) + 1),
    );
    await flush();
  }

  function finishFade(): number {
    const fade = fades[0];
    if (fade === undefined) throw new Error("no fade running");
    fade.complete();
    return fade.opacity;
  }

  async function settle({ waitForRouter = true } = {}): Promise<void> {
    // a finished fade can start another, and a resolved route can start a fade
    for (let i = 0; i < 100; i++) {
      if (waitForRouter) {
        await vi.waitFor(() => {
          if (router.state.status !== "idle" || router.state.isLoading) {
            throw new Error("router busy");
          }
          // the loading bar filling up to "Done"
          if (isLoadingBarShown()) throw new Error("loading bar finishing");
        });
      }
      await flush();
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
    runningFades: () => fades,
    finishFade,
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
  fades.length = 0;
  pageMounts.length = 0;
  pageContent.clear();
  setRouter(undefined);
  setPreloading(true);
  resetLoadingPage();
  setTestActive(false);
  setIsTestRestarting(false);
  setResultCalculating(false);
  configTesting.replaceConfig({});
  setSnapshot(undefined, { dispatchEvent: false });
  for (const name of ["results", "friends"] as const) {
    void blockingData[name].collection?.cleanup();
    blockingData[name].collection = undefined;
  }
}

type DownloadCollection = ReturnType<typeof createDownloadCollection>;

/**
 * A real query collection (like the app's results and friends) downloading
 * from the harness server: already downloaded when the server is ready, else
 * fetching from the start (like after sign in).
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
      startSync: true,
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
 * Lets the app react without finishing fades: waits for pending timers and
 * the next animation frame (fade ins start on one). With fake timers this
 * moves the clock by one frame.
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
