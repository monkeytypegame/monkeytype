import { createSignal, JSXElement } from "solid-js";
import { envConfig } from "virtual:env-config";

import { signIn } from "../../auth";
import * as Notifications from "../../elements/notifications";
import { update } from "../../elements/xp-bar";
import { getInputElement } from "../../input/input-element";
import { showPopup } from "../../modals/simple-modals";
import { showLoaderBar, hideLoaderBar } from "../../signals/loader-bar";
import { hideModal } from "../../stores/modals";
import { toggleUserFakeChartData } from "../../test/result";
import { disableSlowTimerFail } from "../../test/test-timer";
import { setMediaQueryDebugLevel } from "../../ui";
import { toggleCaretDebug } from "../../utils/caret";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

const [mediaQueryDebugLevel, setLocalMediaQueryDebugLevel] = createSignal(0);

export function DevOptionsModal(): JSXElement {
  return (
    <AnimatedModal id="DevOptions" title="Dev Options">
      <div class="flex flex-col gap-4">
        <Button
          type="button"
          onClick={() => showPopup("devGenerateData")}
          fa={{ icon: "fa-database", fixedWidth: true }}
          text="Generate Data"
        />
        <Button
          type="button"
          onClick={() => {
            Notifications.add("This is a test", 1, { duration: 0 });
            Notifications.add("This is a test", 0, { duration: 0 });
            Notifications.add("This is a test", -1, {
              duration: 0,
              details: { test: true, error: "Example error message" },
            });
            hideModal("DevOptions");
          }}
          fa={{ icon: "fa-bell", fixedWidth: true }}
          text="Test Notifications"
        />
        <Button
          type="button"
          onClick={() => {
            const next =
              mediaQueryDebugLevel() >= 2 ? 0 : mediaQueryDebugLevel() + 1;
            setLocalMediaQueryDebugLevel(next);
            Notifications.add(`Setting media query debug level to ${next}`, 5);
            setMediaQueryDebugLevel(next);
          }}
          fa={{ icon: "fa-ruler", fixedWidth: true }}
          text={`Media Query Debug (${mediaQueryDebugLevel()})`}
        />
        <Button
          type="button"
          onClick={() => {
            const el = getInputElement();
            el.style.opacity = "1";
            el.style.marginTop = "1.5em";
            el.style.caretColor = "red";
            hideModal("DevOptions");
          }}
          fa={{ icon: "fa-eye", fixedWidth: true }}
          text="Show Real Words Input"
        />
        <Button
          type="button"
          onClick={() => {
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
            ).then(() => {
              hideLoaderBar();
            });
            hideModal("DevOptions");
          }}
          fa={{ icon: "fa-sign-in-alt", fixedWidth: true }}
          text="Quick Login"
        />
        <Button
          type="button"
          onClick={() => {
            setTimeout(() => {
              void update(1000000, 20800, {
                base: 100,
                fullAccuracy: 200,
                accPenalty: 300,
                quote: 400,
                punctuation: 500,
                streak: 10_000,
                configMultiplier: 2,
              });
            }, 500);
            hideModal("DevOptions");
          }}
          fa={{ icon: "fa-star", fixedWidth: true }}
          text="XP Bar Test"
        />
        <Button
          type="button"
          onClick={toggleUserFakeChartData}
          fa={{ icon: "fa-chart-bar", fixedWidth: true }}
          text="Toggle Fake Chart Data"
        />
        <Button
          type="button"
          onClick={toggleCaretDebug}
          fa={{ icon: "fa-i-cursor", fixedWidth: true }}
          text="Toggle Caret Debug"
        />
        <Button
          type="button"
          onClick={disableSlowTimerFail}
          fa={{ icon: "fa-clock", fixedWidth: true }}
          text="Disable Slow Timer Fail"
        />
      </div>
    </AnimatedModal>
  );
}
