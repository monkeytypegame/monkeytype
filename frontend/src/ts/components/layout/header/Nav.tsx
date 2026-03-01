import { createSignal, JSXElement } from "solid-js";

import { showAlerts } from "../../../elements/alerts";
import { getActivePage, getFocus } from "../../../signals/core";
import { getNotificationBubble } from "../../../signals/header";
import { getSnapshot } from "../../../stores/snapshot";
import { restart } from "../../../test/test-logic";
import { cn } from "../../../utils/cn";
import { getLevelFromTotalXp } from "../../../utils/levels";
import { Button } from "../../common/Button";
import { NotificationBubble } from "../../common/NotificationBubble";
import { UserButton } from "./UserButton";

export function Nav(): JSXElement {
  const [getSpinner, setSpinner] = createSignal(false);
  const [getLoggedIn, setLoggedIn] = createSignal(false);
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
      <UserButton
        loggedIn={getLoggedIn()}
        discordId={getSnapshot()?.discordId}
        discordAvatar={getSnapshot()?.discordAvatar + "a"}
        name={getSnapshot()?.name ?? "Loading..."}
        level={getLevelFromTotalXp(getSnapshot()?.xp ?? 0)}
        showSpinner={getSpinner()}
        onClick={() => alert("hi")}
      />
    </nav>
  );
}
