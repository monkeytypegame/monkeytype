import {
  batch,
  createSignal,
  JSXElement,
  Match,
  ParentProps,
  Switch,
} from "solid-js";

import { createEffectOn } from "../../hooks/effects";
import { getLoadingScreen } from "../../states/loading-page";
import {
  getRoutePage,
  PageName,
  setActivePage,
  setPageTransitioning,
} from "../../states/router";
import { cn } from "../../utils/cn";
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
      <Switch>
        <Match when={mountedPage() === "loading"}>
          <PageFade
            id="pageLoading"
            class="page pageLoading grid h-full w-full content-center items-center gap-4 place-self-center text-center"
          >
            <LoadingPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "about"}>
          <PageFade id="pageAbout" class="page pageAbout full-width">
            <AboutPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "settings"}>
          <PageFade id="pageSettings" class="page pageSettings">
            <SettingsPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "account"}>
          <PageFade id="pageAccount" class="page pageAccount">
            <AccountPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "login"}>
          <PageFade id="pageLogin" class="page pageLogin">
            <LoginPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "profile"}>
          <PageFade id="pageProfile" class="page pageProfile">
            <ProfilePage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "profileSearch"}>
          <PageFade id="pageProfileSearch" class="page pageProfileSearch">
            <ProfileSearchPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "404"}>
          <PageFade id="page404" class="page page404">
            <NotFoundPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "accountSettings"}>
          <PageFade id="pageAccountSettings" class="page pageAccountSettings">
            <AccountSettingsPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "friends"}>
          <PageFade id="pageFriends" class="page pageFriends">
            <FriendsPage />
          </PageFade>
        </Match>
        <Match when={mountedPage() === "leaderboards"}>
          <PageFade id="pageLeaderboards" class="page pageLeaderboards">
            <LeaderboardPage />
          </PageFade>
        </Match>
      </Switch>
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
