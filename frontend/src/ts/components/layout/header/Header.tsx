import { JSXElement } from "solid-js";

import { getIsScreenshotting } from "../../../signals/core";
import { getAccountButtonSpinner } from "../../../signals/header";
import { getAuthenticatedUser, isAuthenticated } from "../../../signals/user";
import { cn } from "../../../utils/cn";

import { Logo } from "./Logo";
import { Nav } from "./Nav";

export function Header(): JSXElement {
  return (
    <>
      <header
        class={cn("flex place-items-center gap-2", {
          "opacity-0": getIsScreenshotting(),
        })}
      >
        <Logo />
        <Nav />
      </header>
      <div class="flex flex-col gap-4">
        <div>{getAccountButtonSpinner() ? "Loading..." : "not loading"}</div>
        <div>{isAuthenticated() ? "authenticated" : "not authenticated"}</div>
        <div>{JSON.stringify(getAuthenticatedUser())}</div>
      </div>
    </>
  );
}

// config signals
// configSyncing

// name
// userFlags

// xp
// discordId
// discordAvatar
// hasPendingFriendRequests
