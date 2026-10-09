import { Component, JSXElement, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import {
  dispatchPageTransition,
  getMountedPage,
  getPageFadePhase,
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

type PageConfig = { component: Component; class?: string };

const pages = {
  loading: {
    component: LoadingPage,
    class:
      "grid h-full w-full content-center items-center gap-4 place-self-center text-center",
  },
  test: { component: TestPage, class: "full-width content-grid" },
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
} satisfies Record<string, PageConfig>;

export type PageName = keyof typeof pages;

// duration of the page fade out and of the fade in
const fadeDuration = 125;

/**
 * Renders the active page, fading the previous one out first. The previous
 * page stays mounted (and alive) while it fades out, so pages never see a
 * navigation while they're visible, and slow pages (eg. settings) don't mount
 * during a fade. See router/page-transition.ts for when pages swap.
 */
export function Pages(): JSXElement {
  return (
    // keyed so each page gets a fresh fade wrapper
    <Show when={getMountedPage()} keyed>
      {(page) => {
        const config: PageConfig = pages[page];
        const id = `page${capitalizeFirstLetter(page)}`;
        return (
          <Anime
            id={id}
            class={cn("page", id, config.class)}
            ref={(el) => {
              if (page === "test") el.setAttribute("data-nosnippet", "");
            }}
            initial={{ opacity: 0 }}
            animation={{
              opacity: getPageFadePhase() === "in" ? 1 : 0,
              duration: fadeDuration,
              onComplete: () =>
                dispatchPageTransition({ type: "fadeCompleted" }),
            }}
          >
            <Dynamic component={config.component} />
          </Anime>
        );
      }}
    </Show>
  );
}
