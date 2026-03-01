import { createSignal, JSXElement } from "solid-js";

import { signOut } from "../../../auth";
import { showAlerts } from "../../../elements/alerts";
import { getActivePage, getFocus } from "../../../signals/core";
import { getNotificationBubble } from "../../../signals/header";
import { getSnapshot, MiniSnapshot } from "../../../stores/snapshot";
import { restart } from "../../../test/test-logic";
import { cn } from "../../../utils/cn";
import { AnimeConditional } from "../../common/anime";
import { Button } from "../../common/Button";
import { NotificationBubble } from "../../common/NotificationBubble";
import { User } from "../../common/User";

export function Nav(): JSXElement {
  const [getSpinner, setSpinner] = createSignal(false);
  const [getLoggedIn, setLoggedIn] = createSignal(true);

  return (
    <nav
      class={cn("flex w-full items-center gap-2 transition-opacity", {
        "opacity-0": getFocus(),
      })}
    >
      <Button onClick={() => setSpinner(!getSpinner())}>toggle spinner</Button>
      <Button onClick={() => setLoggedIn(!getLoggedIn())}>
        toggle logged in
      </Button>
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
          <Button
            type="text"
            onClick={() => signOut()}
            class="hover:[&_.level]:bg-text hover:[&_svg]:fill-text"
          >
            <User
              user={getSnapshot() as MiniSnapshot}
              showAvatar={true}
              showLevel={true}
              iconsOnly={true}
              showSpinner={getSpinner()}
            />
          </Button>
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
