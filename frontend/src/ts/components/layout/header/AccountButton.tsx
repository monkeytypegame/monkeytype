import { createEffect, JSXElement, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";

import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { useSwapAnimation } from "../../../hooks/useSwapAnimation";
import { getAccountButtonSpinner } from "../../../signals/header";
import { getAuthenticatedUser, isAuthenticated } from "../../../signals/user";
import { getLevelFromTotalXp } from "../../../utils/levels";
import { Button } from "../../common/Button";
import { Conditional } from "../../common/Conditional";

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
            class="textButton hover:text-text text-sub hover:[&>.level]:bg-text flex items-center gap-1.5 transition-colors duration-125"
          >
            {/* <div ref={accountButtonRef}>
              <i class="fas fa-fw fa-user"></i>
            </div>
            <div ref={spinnerRef}>
              <i class="fas fa-fw fa-spin fa-circle-notch"></i>
            </div> */}
            <Presence exitBeforeEnter>
              <Show when={!getAccountButtonSpinner()}>
                <Motion
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.125 }}
                >
                  <i class="fas fa-fw fa-user"></i>
                </Motion>
              </Show>
              <Show when={getAccountButtonSpinner()}>
                <Motion
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.125 }}
                >
                  <i class="fas fa-fw fa-spin fa-circle-notch"></i>
                </Motion>
              </Show>
            </Presence>
            <div class="text-xs">{getAuthenticatedUser()?.name}</div>
            <div class="level hover:bg-text bg-sub text-bg rounded-half px-[0.5em] py-[0.1em] text-[0.7em] transition-colors duration-125">
              {getLevelFromTotalXp(getAuthenticatedUser()?.xp ?? 0)}
            </div>
          </button>
        }
        else={
          <Button type="text" icon="far fa-fw fa-user" routerLink="/login" />
        }
      />
    </div>
  );
}
