import { createSignal, JSXElement } from "solid-js";

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

export function Nav(): JSXElement {
  const [showMenu, setShowMenu] = createSignal(false);

  return (
    <nav
      class={cn("flex w-full items-center gap-1 transition-opacity md:gap-2", {
        "opacity-0": getFocus(),
      })}
    >
      <Button
        type="text"
        fa={{
          icon: "fa-keyboard",
          fixedWidth: true,
        }}
        router-link
        href="/"
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
        href="/leaderboards"
      />
      <Button
        type="text"
        fa={{
          icon: "fa-info",
          fixedWidth: true,
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
        href="/settings"
        router-link
      />
      <div class="grow"></div>
      <Button
        type="text"
        fa={{
          icon: "fa-bell",
          fixedWidth: true,
        }}
        onClick={() => {
          void showAlerts();
        }}
        class="relative"
      >
        <NotificationBubble show={getNotificationBubble} />
      </Button>
      <AnimeConditional
        exitBeforeEnter
        if={getSnapshot() !== undefined}
        then={
          <div
            class="relative"
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => setShowMenu(false)}
          >
            <Button
              type="text"
              class="hover:[&_.level]:bg-text hover:[&_svg]:fill-text"
              href="/account"
              router-link
            >
              <User
                user={getSnapshot() as MiniSnapshot}
                showAvatar={true}
                showLevel={true}
                iconsOnly={true}
                showSpinner={getAccountButtonSpinner()}
                hideNameOnSmallScreens={true}
              />
            </Button>
            <AccountMenu show={showMenu()} />
          </div>
        }
        else={
          <Button
            type="text"
            href="/login"
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
