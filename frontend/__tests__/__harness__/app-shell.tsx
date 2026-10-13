/**
 * App-shell test harness: the real route tree in a real RouterProvider (via
 * AppShell), with in-memory history, a test router context (fake auth, test
 * query client), stub pages and page fades completed by the harness.
 *
 * Its vi.mock calls stub the pages and animejs for modules loaded after it.
 * oxfmt sorts imports, so a test file should not import src modules that load
 * pages or anime (eg. routes, RootLayout, AppShell) itself - get them through
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
 *   the app route a user data download to wait for.
 * - `queryData`: seeds the test query client. `queryResponses`: replaces the
 *   app's query functions by query key - pair with `deferred()` to settle a
 *   response mid-test. `app.queryClient` for anything else.
 * - `app.navigate(...)` is the typed router.navigate, `app.router` the router.
 * - Pages are stubs rendering their name; `shownPage()` returns the name of the
 *   page on screen (eg. "loading", "login", "404"), `pagesInDom()` all of
 *   them, `pageElement()` its wrapper. `pageMounts()` records each page
 *   content mount and whether it was attached to the document by then.
 *   `pageContent` adds content to a stub, eg. a probe calling the page's
 *   search hook.
 * - Fades: `settle()` finishes them all. For fade ordering use
 *   `runningFades()` / `finishFade()` (finishes the oldest running fade) and
 *   `flush()` (timers and one animation frame - fade ins start on a frame).
 *   Like anime, a new fade on an element replaces its running one, which then
 *   never completes.
 */
// static json (layouts...) read from disk, the test state module loads some
import "./mock-static";
import { cleanup, render } from "@solidjs/testing-library";
import { hashKey, QueryClient, QueryKey } from "@tanstack/solid-query";
import { createMemoryHistory } from "@tanstack/solid-router";
import { JSXElement } from "solid-js";
import { vi } from "vitest";

import type { RouterAuth } from "../../src/ts/router/context";

import { AppShell } from "../../src/ts/components/AppShell";
import { getDefaultSnapshot } from "../../src/ts/constants/default-snapshot";
import { setSnapshot } from "../../src/ts/db";
import { AppRouter, createAppRouter } from "../../src/ts/router/create-router";
import { setRouter } from "../../src/ts/router/navigate";
import { resetLoadingPage } from "../../src/ts/states/loading-page";

export type Fade = { el: HTMLElement; opacity: number; complete: () => void };

/** A page's content mounting, and whether it was in the document by then. */
export type PageMount = { page: string; attached: boolean };

const { fades, pageMounts, pageContent, blockingData } = vi.hoisted(() => {
  // blocking data the account and friends routes wait for, ready by default
  function readiness(): {
    ready: boolean;
    waiting: (() => void)[];
    set: (ready: boolean) => void;
    wait: () => Promise<void>;
  } {
    const state = {
      ready: true,
      waiting: [] as (() => void)[],
      set: (ready: boolean) => {
        state.ready = ready;
        if (!ready) return;
        for (const resolve of state.waiting.splice(0)) resolve();
      },
      wait: async () => {
        if (state.ready) return;
        return new Promise<void>((resolve) => state.waiting.push(resolve));
      },
    };
    return state;
  }
  return {
    fades: [] as Fade[],
    pageMounts: [] as PageMount[],
    pageContent: new Map<string, () => JSXElement>(),
    blockingData: { results: readiness(), friends: readiness() },
  };
});

// results and friends are collections synced outside the router context
vi.mock(import("../../src/ts/collections/results"), async (importOriginal) => ({
  ...(await importOriginal()),
  isResultsReady: () => blockingData.results.ready,
  waitForResultsReady: blockingData.results.wait,
}));
vi.mock(
  import("../../src/ts/collections/connections"),
  async (importOriginal) => ({
    ...(await importOriginal()),
    isConnectionsReady: () => blockingData.friends.ready,
    waitForConnectionsReady: blockingData.friends.wait,
  }),
);

vi.mock("animejs", () => ({
  animate: (
    el: HTMLElement,
    params: { opacity: number; duration: number; onComplete?: () => void },
  ) => {
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
  /** Account results download. Default "ready". */
  results?: "ready" | "pending";
  /** Friends download. Default "ready". */
  friends?: "ready" | "pending";
  /**
   * Extra content for stub pages by component name (eg. `LeaderboardPage`),
   * rendered inside the page - for probes using the page's hooks.
   */
  pageContent?: Record<string, () => JSXElement>;
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
  /** Finishes pending blocking data downloads. */
  blockingData: { loadResults: () => void; loadFriends: () => void };
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
  blockingData.results.set(options.results !== "pending");
  blockingData.friends.set(options.friends !== "pending");
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
    { history: createMemoryHistory({ initialEntries: [options.url ?? "/"] }) },
  );
  // vanilla modules and router state memos read the router through this holder
  setRouter(router);

  const { container } = render(() => <AppShell router={router} />);

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
    },
    runningFades: () => fades,
    finishFade,
  };
}

/** Unmounts the app and resets shared state. Call in afterEach. */
export function cleanupApp(): void {
  cleanup();
  fades.length = 0;
  pageMounts.length = 0;
  pageContent.clear();
  setRouter(undefined);
  resetLoadingPage();
  setSnapshot(undefined, { dispatchEvent: false });
}

function pageName(el: Element): string {
  const name = el.id.replace(/^page/, "");
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Lets the app react without finishing fades: waits for pending timers and
 * the next animation frame (fade ins start on one).
 */
export async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
