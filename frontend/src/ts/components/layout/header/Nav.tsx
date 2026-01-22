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
        icon="fas fa-fw fa-keyboard"
        routerLink="/"
        onClick={() => {
          if (getActivePage() === "test") restart();
        }}
      />
      <Button
        type="text"
        icon="fas fa-fw fa-crown"
        routerLink="/leaderboards"
      />
      <Button type="text" icon="fas fa-fw fa-info" routerLink="/about" />
      <Button type="text" icon="fas fa-fw fa-cog" routerLink="/settings" />
      <div class="grow"></div>
      <Button
        type="text"
        icon="fas fa-fw fa-bell"
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
