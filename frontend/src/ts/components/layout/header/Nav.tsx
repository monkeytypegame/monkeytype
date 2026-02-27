import { JSXElement } from "solid-js";

import { showAlerts } from "../../../elements/alerts";
import { getActivePage, getFocus } from "../../../signals/core";
import { getNotificationBubble } from "../../../signals/header";
import { restart } from "../../../test/test-logic";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { NotificationBubble } from "../../common/NotificationBubble";
import { AccountButton } from "./AccountButton";

export function Nav(): JSXElement {
  return (
    <nav
      class={cn("flex w-full items-center gap-2 transition-opacity", {
        "opacity-0": getFocus(),
      })}
    >
      <Button
        type="text"
        fa={{
          icon: "fa-keyboard",
          fixedWidth: true,
        }}
        routerLink="/"
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
        routerLink="/leaderboards"
      />
      <Button
        type="text"
        fa={{
          icon: "fa-info",
          fixedWidth: true,
        }}
        routerLink="/about"
      />
      <Button
        type="text"
        fa={{
          icon: "fa-cog",
          fixedWidth: true,
        }}
        routerLink="/settings"
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
      <AccountButton />
    </nav>
  );
}
