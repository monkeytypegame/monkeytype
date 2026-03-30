import { useQuery } from "@tanstack/solid-query";
import { createMemo, JSXElement, Show } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { createEffectOn } from "../../../hooks/effects";
import {
  prefetchAboutPage,
  prefetchLeaderboardPage,
} from "../../../queries/prefetch";
import { getServerConfigurationQueryOptions } from "../../../queries/server-configuration";
import { getActivePage } from "../../../states/core";
import {
  getAccountButtonSpinner,
  getAnimatedLevel,
  setAnimatedLevel,
} from "../../../states/header";
import { showModal } from "../../../states/modals";
import { getSnapshot } from "../../../states/snapshot";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { getLevelFromTotalXp } from "../../../utils/levels";
import { AnimeConditional } from "../../common/anime";
import { Button } from "../../common/Button";
import { NotificationBubble } from "../../common/NotificationBubble";
import { User } from "../../common/User";
import { AccountMenu } from "./AccountMenu";
import { AccountXpBar } from "./AccountXpBar";

export function Nav(): JSXElement {
  const buttonClass = () =>
    cn("aspect-square", {
      "opacity-(--nav-focus-opacity)": getFocus(),
    });

  createEffectOn(getSnapshot, (snapshot) => {
    if (snapshot === undefined) {
      setAnimatedLevel(0);
      return;
    }
    setAnimatedLevel(getLevelFromTotalXp(snapshot.xp ?? 0));
  });

  const showFriendsNotificationBubble = createMemo((): boolean => {
    const friends = getSnapshot()?.connections;

    if (friends !== undefined) {
      const pendingFriendRequests = Object.values(friends).filter(
        (it) => it === "incoming",
      ).length;
      if (pendingFriendRequests > 0) {
        return true;
      }
    }
    return false;
  });

  const showAlertsNotificationBubble = createMemo((): boolean => {
    const snapshot = getSnapshot();
    if (snapshot === undefined) return false;

    return snapshot.inboxUnreadSize > 0;
  });

  const serverConfig = useQuery(() => getServerConfigurationQueryOptions());
  const showLoginButton = (): boolean =>
    serverConfig.data?.users.signUp ?? true;

  return (
    <nav class={cn("z-5 flex w-full items-center gap-1 md:gap-2")}>
      <Button
        variant="text"
        fa={{
          icon: "fa-keyboard",
          fixedWidth: true,
        }}
        router-link
        href="/"
        class={buttonClass()}
        dataset={{
          "data-nav-item": "test",
        }}
        onClick={() => {
          if (getActivePage() === "test") restartTestEvent.dispatch();
        }}
      />
      <Button
        variant="text"
        fa={{
          icon: "fa-crown",
          fixedWidth: true,
        }}
        router-link
        dataset={{
          "data-nav-item": "leaderboards",
        }}
        class={buttonClass()}
        href="/leaderboards"
        onMouseEnter={() => {
          prefetchLeaderboardPage();
        }}
      />
      <Button
        variant="text"
        fa={{
          icon: "fa-info",
          fixedWidth: true,
        }}
        class={buttonClass()}
        dataset={{
          "data-nav-item": "about",
        }}
        href="/about"
        router-link
        onMouseEnter={() => {
          prefetchAboutPage();
        }}
      />
      <Button
        variant="text"
        fa={{
          icon: "fa-cog",
          fixedWidth: true,
        }}
        class={buttonClass()}
        href="/settings"
        dataset={{
          "data-nav-item": "settings",
        }}
        router-link
      />
      <div class="grow"></div>
      <Button
        variant="text"
        fa={{
          icon: "fa-bell",
          fixedWidth: true,
        }}
        dataset={{
          "data-nav-item": "alerts",
        }}
        onClick={() => {
          showModal("Alerts");
        }}
        class={cn(buttonClass(), "relative")}
      >
        <NotificationBubble
          variant="fromCorner"
          show={showAlertsNotificationBubble()}
        />
      </Button>
      <AnimeConditional
        exitBeforeEnter
        if={getSnapshot()}
        then={(snap) => (
          <>
            <div
              class={cn(
                "relative",
                !getFocus() &&
                  "hover:**:data-[ui-element='accountMenu']:pointer-events-auto hover:**:data-[ui-element='accountMenu']:opacity-100",
                "has-focus-visible:**:data-[ui-element='accountMenu']:pointer-events-auto has-focus-visible:**:data-[ui-element='accountMenu']:opacity-100",
              )}
            >
              <Button
                variant="text"
                class={cn(
                  "h-full",
                  "hover:**:data-[ui-element='userLevel']:bg-(--themable-button-hover-text)",
                  { "opacity-(--nav-focus-opacity)": getFocus() },
                )}
                href="/account"
                router-link
                dataset={{
                  "data-nav-item": "account",
                }}
              >
                <User
                  user={snap()}
                  showAvatar={true}
                  iconsOnly={true}
                  hideNameOnSmallScreens={true}
                  level={getAnimatedLevel()}
                  showSpinner={getAccountButtonSpinner()}
                  showNotificationBubble={showFriendsNotificationBubble()}
                  fontClass="text-em-xs"
                />
              </Button>
              <AccountMenu
                showFriendsNotificationBubble={showFriendsNotificationBubble()}
              />
            </div>
            <div class="relative">
              <AccountXpBar />
            </div>
          </>
        )}
        else={
          <Show when={showLoginButton()}>
            <Button
              variant="text"
              href="/login"
              dataset={{
                "data-nav-item": "login",
              }}
              fa={{
                icon: "fa-user",
                variant: "regular",
                fixedWidth: true,
              }}
              router-link
              class={buttonClass()}
            />
          </Show>
        }
      />
    </nav>
  );
}
