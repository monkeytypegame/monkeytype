import {
  batch,
  Component,
  createSignal,
  JSXElement,
  ParentProps,
  Show,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import { createEffectOn } from "../../hooks/effects";
import { getLoadingScreen } from "../../states/loading-page";
import {
  getRoutePage,
  PageName,
  setActivePage,
  setPageTransitioning,
} from "../../states/router";
import { cn } from "../../utils/cn";
import { capitalizeFirstLetter } from "../../utils/strings";
import { Anime } from "../common/anime";
import { NotFoundPage } from "./404Page";
import { AboutPage } from "./AboutPage";
import { AccountSettingsPage } from "./account-settings/AccountSettingsPage";
import { AccountPage } from "./account/AccountPage";
import { FriendsPage } from "./connections/FriendsPage";
import { LeaderboardPage } from "./leaderboard/LeaderboardPage";
import { LoadingPage } from "./LoadingPage";
import { LoginPage } from "./login/LoginPage";
import { ProfilePage } from "./profile/ProfilePage";
import { ProfileSearchPage } from "./profile/ProfileSearchPage";
import { SettingsPage } from "./settings/SettingsPage";
import { TestPage } from "./test/TestPage";

// the test page is rendered separately (see TestPageShell)
const pages: Record<
  Exclude<PageName, "test">,
  { component: Component; class?: string }
> = {
  loading: {
    component: LoadingPage,
    class:
      "grid h-full w-full content-center items-center gap-4 place-self-center text-center",
  },
  about: { component: AboutPage, class: "full-width" },
  settings: { component: SettingsPage },
  account: { component: AccountPage },
  login: { component: LoginPage },
  profile: { component: ProfilePage },
  profileSearch: { component: ProfileSearchPage },
  "404": { component: NotFoundPage },
  accountSettings: { component: AccountSettingsPage },
  friends: { component: FriendsPage },
  leaderboards: { component: LeaderboardPage },
};

// duration of the page fade out and of the fade in
const fadeDuration = 125;

/** The page that should be on screen (the loading page covers the route while it loads). */
const targetPage = (): PageName =>
  getLoadingScreen() === "hidden" ? getRoutePage() : "loading";

/**
 * Lags behind targetPage: the current page stays mounted (and alive) while it
 * fades out, and is only swapped once the fade out has completed. Pages never
 * see a navigation while they're visible, and slow pages (eg. settings) don't
 * mount during a fade.
 */
const [mountedPage, setMountedPage] = createSignal<PageName>();
const [fadePhase, setFadePhase] = createSignal<"in" | "out">("in");

function mount(page: PageName): void {
  batch(() => {
    setActivePage(page);
    setMountedPage(page);
    setFadePhase("in");
  });
}

const nonTestPage = (): Exclude<PageName, "test"> | undefined => {
  const page = mountedPage();
  return page === "test" ? undefined : page;
};

/** Called when the mounted page finishes fading in or out. */
function onFadeComplete(): void {
  if (fadePhase() === "out") {
    // whatever the route is by now, so rapid navigation ends up on the last page
    mount(targetPage());
  } else if (mountedPage() !== "loading") {
    // the loading page doesn't end it - the route is still loading
    // (a failed load ends the transition in the router)
    setPageTransitioning(false);
  }
}

/**
 * Renders the page for the active route, fading the previous one out first.
 * The test page is never unmounted (vanilla code holds references into it).
 */
export function Pages(): JSXElement {
  createEffectOn(targetPage, (next) => {
    const current = mountedPage();
    if (current === undefined) {
      mount(next);
      return;
    }
    // navigating back to the page that is fading out fades it back in
    setFadePhase(next === current ? "in" : "out");
  });

  return (
    <>
      <TestPageShell />
      {/* keyed so each page gets a fresh fade wrapper */}
      <Show when={nonTestPage()} keyed>
        {(page) => {
          const id = `page${capitalizeFirstLetter(page)}`;
          return (
            <PageFade id={id} class={cn("page", id, pages[page].class)}>
              <Dynamic component={pages[page].component} />
            </PageFade>
          );
        }}
      </Show>
    </>
  );
}

/** Page wrapper that fades with the shared fade phase. */
function PageFade(
  props: ParentProps<{ id: string; class: string }>,
): JSXElement {
  return (
    <Anime
      id={props.id}
      class={props.class}
      initial={{ opacity: 0 }}
      animation={{
        opacity: fadePhase() === "in" ? 1 : 0,
        duration: fadeDuration,
        onComplete: onFadeComplete,
      }}
    >
      {props.children}
    </Anime>
  );
}

function TestPageShell(): JSXElement {
  const isVisible = (): boolean =>
    mountedPage() === "test" && fadePhase() === "in";

  // display: none once faded out, so it takes no space while other pages show
  const [isHidden, setHidden] = createSignal(true);
  createEffectOn(isVisible, (visible) => {
    if (visible) setHidden(false);
  });

  return (
    <Anime
      class={cn("page pageTest full-width content-grid", {
        hidden: isHidden(),
      })}
      ref={(el) => el.setAttribute("data-nosnippet", "")}
      animation={{
        opacity: isVisible() ? 1 : 0,
        duration: fadeDuration,
        onComplete: () => {
          setHidden(!isVisible());
          if (mountedPage() === "test") onFadeComplete();
        },
      }}
    >
      <TestPage />
    </Anime>
  );
}
