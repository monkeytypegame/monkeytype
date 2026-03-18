import { createSignal, For, JSXElement } from "solid-js";
import { envConfig } from "virtual:env-config";

import Ape from "../../ape";
import { signIn } from "../../auth";
import { inboxCollection } from "../../collections/inbox";
import { addXp } from "../../db";
import { toggleCaretDebug } from "../../elements/caret";
import { getInputElement } from "../../input/input-element";
import { showPopup } from "../../modals/simple-modals";
import { showLoaderBar, hideLoaderBar } from "../../states/loader-bar";
import { hideModal, showModal } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { toggleUserFakeChartData } from "../../test/result";
import { disableSlowTimerFail } from "../../test/test-timer";
import { FaSolidIcon } from "../../types/font-awesome";
import { setMediaQueryDebugLevel } from "../../ui";
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
        showSuccessNotification("This is a test", { durationMs: 0 });
        showNoticeNotification("This is a test", { durationMs: 0 });
        showErrorNotification("This is a test", {
          durationMs: 0,
          details: { test: true, error: "Example error message" },
        });
        showNoticeNotification("useInnerHtml<br>test", {
          durationMs: 0,
          useInnerHtml: true,
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
        showNoticeNotification(`Setting media query debug level to ${next}`);
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
          showErrorNotification(
            "Quick login credentials not set. Add QUICK_LOGIN_EMAIL and QUICK_LOGIN_PASSWORD to your frontend .env file.",
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
              showErrorNotification(result.message);
            }
          })
          .catch((error: unknown) => {
            showErrorNotification("Quick login failed", { error });
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
      icon: "fa-inbox",
      label: () => "Add Debug Inbox Item",
      onClick: () => {
        showModal("DevInboxPicker");
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

  const addDebugInboxItem = (rewardType: "xp" | "badge" | "none"): void => {
    hideModal("DevInboxPicker");
    void Ape.dev
      .addDebugInboxItem({ body: { rewardType } })
      .then((response) => {
        if (response.status !== 200) {
          showErrorNotification("Failed to add inbox item", {
            details: response.body,
          });
          return;
        }
        showSuccessNotification("Debug inbox item added");
        void inboxCollection.utils.refetch();
      });
  };

  return (
    <>
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
      <AnimatedModal id="DevInboxPicker" title="Choose Reward Type">
        <div class="flex flex-col gap-4">
          <Button
            variant="button"
            onClick={() => addDebugInboxItem("xp")}
            fa={{ icon: "fa-star", fixedWidth: true }}
            text="XP Reward (1000)"
          />
          <Button
            variant="button"
            onClick={() => addDebugInboxItem("badge")}
            fa={{ icon: "fa-certificate", fixedWidth: true }}
            text="Badge Reward"
          />
          <Button
            variant="button"
            onClick={() => addDebugInboxItem("none")}
            fa={{ icon: "fa-envelope", fixedWidth: true }}
            text="No Reward"
          />
        </div>
      </AnimatedModal>
    </>
  );
}
