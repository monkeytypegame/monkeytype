import { createEffect, createSignal, JSXElement } from "solid-js";

import { showAlerts } from "../../../elements/alerts";
import { getActivePage, getFocus } from "../../../signals/core";
import {
  getAccountButtonSpinner,
  getNotificationBubble,
} from "../../../signals/header";
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
          show={getNotificationBubble()}
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
                  showNotificationBubble={true}
                />
              </Button>
              {/* todo: connect notification bubbles in the user and account menu */}
              <AccountMenu show={showMenu()} />
            </div>
            <div class="relative">
              <AccountXpBar />
            </div>
          </>
        }
        else={
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
          />
        }
      />
    </nav>
  );
}
