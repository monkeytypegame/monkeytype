import { useQuery } from "@tanstack/solid-query";
import { createEffect, createSignal, JSXElement, Show } from "solid-js";

import { showAlerts } from "../../../elements/alerts";
import { getServerConfigurationQueryOptions } from "../../../queries/server-configuration";
import { getActivePage, getFocus } from "../../../signals/core";
import { getAccountButtonSpinner } from "../../../signals/header";
import { getSnapshot, MiniSnapshot } from "../../../stores/snapshot";
import { restart } from "../../../test/test-logic";
import { cn } from "../../../utils/cn";
import { AnimeConditional } from "../../common/anime";
import { Button } from "../../common/Button";
import { NotificationBubble } from "../../common/NotificationBubble";
import { User } from "../../common/User";
import { AccountMenu } from "./AccountMenu";
import { AccountXpBar } from "./AccountXpBar";

export function Nav(): JSXElement {
  const [showMenu, setShowMenu] = createSignal(false);
  const buttonClass = cn("aspect-square");
  createEffect(() => {
    if (getSnapshot() === undefined) {
      setShowMenu(false);
    }
  });

  const showFriendsNotificationBubble = (): boolean => {
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
  };

  const showAlertsNotificationBubble = (): boolean => {
    const snapshot = getSnapshot();
    if (snapshot === undefined) return false;

    return snapshot.inboxUnreadSize > 0;
  };

  const serverConfig = useQuery(() => getServerConfigurationQueryOptions());
  const showLoginButton = (): boolean =>
    serverConfig.data?.users.signUp ?? true;

  return (
    <nav
      class={cn(
        "z-5 flex w-full items-center gap-1 transition-opacity md:gap-2",
        {
          "opacity-0": getFocus(),
        },
      )}
    >
      <Button
        type="text"
        fa={{
          icon: "fa-keyboard",
          fixedWidth: true,
        }}
        router-link
        href="/"
        class={buttonClass}
        dataset={{
          "data-nav-item": "test",
        }}
        onClick={() => {
          if (getActivePage() === "test") restart();
        }}
      />
      <Button
        type="text"
        fa={{
          icon: "fa-crown",
          fixedWidth: true,
        }}
        router-link
        dataset={{
          "data-nav-item": "leaderboards",
        }}
        class={buttonClass}
        href="/leaderboards"
      />
      <Button
        type="text"
        fa={{
          icon: "fa-info",
          fixedWidth: true,
        }}
        class={buttonClass}
        dataset={{
          "data-nav-item": "about",
        }}
        href="/about"
        router-link
      />
      <Button
        type="text"
        fa={{
          icon: "fa-cog",
          fixedWidth: true,
        }}
        class={buttonClass}
        href="/settings"
        dataset={{
          "data-nav-item": "settings",
        }}
        router-link
      />
      <div class="grow"></div>
      <Button
        type="text"
        fa={{
          icon: "fa-bell",
          fixedWidth: true,
        }}
        dataset={{
          "data-nav-item": "alerts",
        }}
        onClick={() => {
          void showAlerts();
        }}
        class={cn(buttonClass, "relative")}
      >
        <NotificationBubble
          variant="fromCorner"
          show={showAlertsNotificationBubble()}
        />
      </Button>
      <AnimeConditional
        exitBeforeEnter
        if={getSnapshot() !== undefined}
        then={
          <>
            <div
              class="relative"
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}
            >
              <Button
                type="text"
                class={cn(
                  "h-full",
                  "hover:[&_.level]:bg-text hover:[&_svg]:fill-text",
                )}
                href="/account"
                router-link
                dataset={{
                  "data-nav-item": "account",
                }}
              >
                <User
                  user={getSnapshot() as MiniSnapshot}
                  showAvatar={true}
                  showLevel={true}
                  iconsOnly={true}
                  showSpinner={getAccountButtonSpinner()}
                  hideNameOnSmallScreens={true}
                  showNotificationBubble={showFriendsNotificationBubble()}
                />
              </Button>
              <AccountMenu
                show={showMenu()}
                showFriendsNotificationBubble={showFriendsNotificationBubble()}
              />
            </div>
            <div class="relative">
              <AccountXpBar />
            </div>
          </>
        }
        else={
          <Show when={showLoginButton()}>
            <Button
              type="text"
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
              class={buttonClass}
            />
          </Show>
        }
      />
    </nav>
  );
}
