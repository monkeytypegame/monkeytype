import { createEffect, JSXElement, Show } from "solid-js";

import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { useSwapAnimation } from "../../../hooks/useSwapAnimation";
import { getAccountButtonSpinner } from "../../../signals/header";
import { getAuthenticatedUser, isAuthenticated } from "../../../signals/user";
import { getLevelFromTotalXp } from "../../../utils/levels";
import { Anime, AnimePresence } from "../../common/anime";
import { Button } from "../../common/Button";
import { Conditional } from "../../common/Conditional";
import { DiscordAvatar } from "../../common/DiscordAvatar";
import { Fa } from "../../common/Fa";

export function AccountButton(): JSXElement {
  const [_accountButtonRef, accountButtonEl] = useRefWithUtils();
  const [_spinnerRef, spinnerEl] = useRefWithUtils();

  const { setVisibleElement } = useSwapAnimation({
    elements: {
      button: accountButtonEl,
      spinner: spinnerEl,
    },
    initial: "button",
  });

  createEffect(() => {
    setVisibleElement(getAccountButtonSpinner() ? "spinner" : "button");
  });

  return (
    <div>
      <Conditional
        if={isAuthenticated()}
        then={
          <button
            type="button"
            class="textButton flex items-center gap-1.5 text-sub transition-colors duration-125 hover:text-text hover:[&>.level]:bg-text"
          >
            <AnimePresence exitBeforeEnter>
              <Show when={true}>
                <Anime
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, duration: 125 }}
                  exit={{ opacity: 0 }}
                  class="grid items-center"
                >
                  <DiscordAvatar
                    size={64}
                    discordId={getAuthenticatedUser()?.discordId}
                    discordAvatar={getAuthenticatedUser()?.discordAvatar}
                    fallbackIcon={{
                      icon: "fa-user",
                    }}
                  />
                </Anime>
              </Show>
              <Show when={true}>
                <Anime
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, duration: 125 }}
                  exit={{ opacity: 0 }}
                >
                  <Fa icon={"fa-circle-notch"} spin={true} />
                </Anime>
              </Show>
            </AnimePresence>
            <div class="text-xs">{getAuthenticatedUser()?.name}</div>
            <div class="level rounded-half bg-sub px-[0.5em] py-[0.1em] text-[0.7em] text-bg transition-colors duration-125 hover:bg-text">
              {getLevelFromTotalXp(getAuthenticatedUser()?.xp ?? 0)}
            </div>
          </button>
        }
        else={
          <Button
            type="text"
            fa={{
              icon: "fa-user",
              variant: "regular",
              fixedWidth: true,
            }}
            routerLink="/login"
          />
        }
      />
    </div>
  );
}
