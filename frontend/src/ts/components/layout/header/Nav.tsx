import { createEffect, createSignal, JSXElement } from "solid-js";

import { showAlerts } from "../../../elements/alerts";
import { getActivePage, getFocus } from "../../../signals/core";
import {
  getAccountButtonSpinner,
  getNotificationBubble,
} from "../../../signals/header";
import {
  getSnapshot,
  MiniSnapshot,
  setSnapshot,
} from "../../../stores/snapshot";
import { restart } from "../../../test/test-logic";
import { cn } from "../../../utils/cn";
import { getXpDetails } from "../../../utils/levels";
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
    console.log(
      "User level:",
      getSnapshot()?.xp,
      "XP details:",
      getSnapshot() ? getXpDetails(getSnapshot()?.xp ?? 0) : "N/A",
    );
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
        text="10xp"
        onClick={() => {
          const snapshot = getSnapshot();
          if (!snapshot) return;
          setSnapshot({
            ...snapshot,
            xp: snapshot.xp + 10,
          });
        }}
      />
      <Button
        text="100xp"
        onClick={() => {
          const snapshot = getSnapshot();
          if (!snapshot) return;
          setSnapshot({
            ...snapshot,
            xp: snapshot.xp + 100,
          });
        }}
      />
      <Button
        text="1000xp"
        onClick={() => {
          const snapshot = getSnapshot();
          if (!snapshot) return;
          setSnapshot({
            ...snapshot,
            xp: snapshot.xp + 1000,
          });
        }}
      />
      <Button
        text="10000xp"
        onClick={() => {
          const snapshot = getSnapshot();
          if (!snapshot) return;
          setSnapshot({
            ...snapshot,
            xp: snapshot.xp + 100000,
          });
        }}
      />
      <Button
        type="text"
        fa={{
          icon: "fa-keyboard",
          fixedWidth: true,
        }}
        router-link
        href="/"
        class={buttonClass}
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
        class={cn(buttonClass, "relative")}
      >
        <NotificationBubble show={getNotificationBubble} />
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
            <div class="relative">
              <AccountXpBar xp={getSnapshot()?.xp ?? 0} />
            </div>
          </>
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
