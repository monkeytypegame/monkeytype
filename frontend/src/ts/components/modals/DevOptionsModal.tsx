import { createSignal, For, JSXElement } from "solid-js";
import { envConfig } from "virtual:env-config";

import { signIn } from "../../auth";
import { addXp } from "../../db";
import * as Notifications from "../../elements/notifications";
import { getInputElement } from "../../input/input-element";
import { showPopup } from "../../modals/simple-modals";
import { showLoaderBar, hideLoaderBar } from "../../signals/loader-bar";
import { hideModal } from "../../stores/modals";
import { toggleUserFakeChartData } from "../../test/result";
import { disableSlowTimerFail } from "../../test/test-timer";
import { FaSolidIcon } from "../../types/font-awesome";
import { setMediaQueryDebugLevel } from "../../ui";
import { toggleCaretDebug } from "../../utils/caret";
import { createErrorMessage } from "../../utils/misc";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

const [mediaQueryDebugLevel, setLocalMediaQueryDebugLevel] = createSignal(0);

type DevButton = {
  icon: FaSolidIcon;
  label: () => string;
  onClick: () => void;
};

export function DevOptionsModal(): JSXElement {
  const buttons: DevButton[] = [
    {
      icon: "fa-database",
      label: () => "Generate Data",
      onClick: () => showPopup("devGenerateData"),
    },
    {
      icon: "fa-bell",
      label: () => "Test Notifications",
      onClick: () => {
        Notifications.add("This is a test", 1, { duration: 0 });
        Notifications.add("This is a test", 0, { duration: 0 });
        Notifications.add("This is a test", -1, {
          duration: 0,
          details: { test: true, error: "Example error message" },
        });
        hideModal("DevOptions");
      },
    },
    {
      icon: "fa-ruler",
      label: () => `Media Query Debug (${mediaQueryDebugLevel()})`,
      onClick: () => {
        const next =
          mediaQueryDebugLevel() >= 2 ? 0 : mediaQueryDebugLevel() + 1;
        setLocalMediaQueryDebugLevel(next);
        Notifications.add(`Setting media query debug level to ${next}`, 5);
        setMediaQueryDebugLevel(next);
      },
    },
    {
      icon: "fa-eye",
      label: () => "Show Real Words Input",
      onClick: () => {
        const el = getInputElement();
        el.style.opacity = "1";
        el.style.marginTop = "1.5em";
        el.style.caretColor = "red";
        hideModal("DevOptions");
      },
    },
    {
      icon: "fa-sign-in-alt",
      label: () => "Quick Login",
      onClick: () => {
        if (
          envConfig.quickLoginEmail === undefined ||
          envConfig.quickLoginPassword === undefined
        ) {
          Notifications.add(
            "Quick login credentials not set. Add QUICK_LOGIN_EMAIL and QUICK_LOGIN_PASSWORD to your frontend .env file.",
            -1,
          );
          return;
        }
        showLoaderBar();
        void signIn(
          envConfig.quickLoginEmail,
          envConfig.quickLoginPassword,
          true,
        )
          .then((result) => {
            if (!result.success) {
              Notifications.add(result.message, -1);
            }
          })
          .catch((error: unknown) => {
            Notifications.add(
              createErrorMessage(error, "Quick login failed"),
              -1,
            );
          })
          .finally(() => {
            hideLoaderBar();
          });
        hideModal("DevOptions");
      },
    },
    {
      icon: "fa-star",
      label: () => "XP Simple Test",
      onClick: () => {
        setTimeout(() => {
          addXp(1000);
        }, 500);
        hideModal("DevOptions");
      },
    },
    {
      icon: "fa-star",
      label: () => "XP with breakdown Test",
      onClick: () => {
        setTimeout(() => {
          const fakeBreakdown = {
            base: 100,
            quote: 10,
            corrected: 5,
            funbox: 5,
            streak: 10,
            incomplete: 10,
            accPenalty: 5,
            configMultiplier: 2,
            daily: 10000,
          };
          const totalFakeXp = 10270;
          addXp(totalFakeXp, fakeBreakdown);
        }, 500);
        hideModal("DevOptions");
      },
    },
    {
      icon: "fa-chart-bar",
      label: () => "Toggle Fake Chart Data",
      onClick: toggleUserFakeChartData,
    },
    {
      icon: "fa-i-cursor",
      label: () => "Toggle Caret Debug",
      onClick: toggleCaretDebug,
    },
    {
      icon: "fa-clock",
      label: () => "Disable Slow Timer Fail",
      onClick: disableSlowTimerFail,
    },
  ];

  return (
    <AnimatedModal id="DevOptions" title="Dev Options">
      <div class="flex flex-col gap-4">
        <For each={buttons}>
          {(btn) => (
            <Button
              variant="button"
              onClick={btn.onClick}
              fa={{ icon: btn.icon, fixedWidth: true }}
              text={btn.label()}
            />
          )}
        </For>
      </div>
    </AnimatedModal>
  );
}
