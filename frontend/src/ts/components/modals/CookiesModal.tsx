import { createEffect, createSignal, JSXElement } from "solid-js";

import { showConsentPopup } from "../../controllers/ad-controller";
import { setAcceptedCookies } from "../../cookies";
import { hideModal, isModalOpen } from "../../states/modals";
import { showErrorNotification } from "../../states/notifications";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { AnimeConditional } from "../common/anime";
import { Button } from "../common/Button";
import { H3 } from "../common/Headers";

export function CookiesModal(): JSXElement {
  // const isOpen = (): boolean => isModalOpen("Cookies");
  const [showSettings, setShowSettings] = createSignal(false);
  const [accepted, setAccepted] = createSignal({
    security: true,
    analytics: false,
    sentry: false,
  });

  createEffect(() => {
    if (!isModalOpen("Cookies")) {
      setShowSettings(false);
      setAccepted({
        security: true,
        analytics: false,
        sentry: false,
      });
    }
  });

  return (
    <AnimatedModal
      id="Cookies"
      modalClass="min-w-[500px]"
      wrapperClass="justify-end items-end"
      closeOnEscape={false}
      closeOnWrapperClick={false}
    >
      <H3
        text="We use cookies by the way"
        fa={{ icon: "fa-cookie-bite" }}
        class="mb-0 pb-0 text-2xl"
      />
      <AnimeConditional
        if={!showSettings()}
        then={
          <div class="grid gap-4">
            <div>
              Cookies enhance your experience and help us improve our website.
            </div>
            <div class="grid gap-2">
              <Button
                text="accept all"
                active={true}
                onClick={() => {
                  setAccepted({
                    security: true,
                    analytics: true,
                    sentry: true,
                  });
                  setAcceptedCookies(accepted());
                  hideModal("Cookies");
                }}
              />
              <Button
                text="reject non-essential"
                onClick={() => {
                  setAccepted({
                    security: true,
                    analytics: false,
                    sentry: false,
                  });
                  setAcceptedCookies(accepted());
                  hideModal("Cookies");
                }}
              />
              <Button
                text="more options"
                onClick={() => setShowSettings(true)}
              />
            </div>
          </div>
        }
        else={
          <div class="grid gap-4">
            <SettingsSection
              title="security"
              description={
                <div>
                  We use Cloudflare cookies to improve security and performance
                  of our site. They do not store any personal information and
                  are required.
                </div>
              }
              checked={true}
              disabled={true}
            />
            <SettingsSection
              title="analytics"
              description="We use Google Analytics to track the overall traffic and
            demographics of our site."
              checked={false}
              onChange={(checked) =>
                setAccepted({ ...accepted(), analytics: checked })
              }
            />
            <SettingsSection
              title="sentry"
              description="We use Sentry to track errors and performance issues on our site, as
            well as record anonymized user sessions to help us debug issues and
            improve experience."
              checked={false}
              onChange={(checked) =>
                setAccepted({ ...accepted(), sentry: checked })
              }
            />
            <SettingsSection
              title="advertising"
              description={
                <div class="grid grid-cols-[auto_1fr] items-center gap-4">
                  <div>
                    Our advertising partner may use cookies to deliver ads that
                    are more relevant to you.
                  </div>
                  <Button
                    fa={{ icon: "fa-external-link-alt", fixedWidth: true }}
                    class="text-[0.85em]"
                    onClick={() => {
                      try {
                        showConsentPopup();
                      } catch (e) {
                        console.error("Failed to open ad consent UI");
                        console.error(e);
                        showErrorNotification(
                          "Failed to open Ad consent popup. Do you have an ad or cookie popup blocker enabled?",
                        );
                      }
                    }}
                  />
                  {/* <Button
                    text="Click to change your preferences on ad related cookies"
                    variant="text"
                    class="text-left p-0 mt-2"
                  /> */}
                </div>
              }
              checked={false}
              hideCheckbox={true}
            />
            <Button
              text="accept selected"
              onClick={() => {
                setAcceptedCookies(accepted());
                hideModal("Cookies");
              }}
            />
          </div>
        }
      />
    </AnimatedModal>
  );
}

function SettingsSection(props: {
  title: string;
  description: string | JSXElement;
  checked: boolean;
  disabled?: boolean;
  hideCheckbox?: boolean;
  onChange?: (checked: boolean) => void;
}): JSXElement {
  return (
    <label
      class={cn(
        "grid grid-cols-[auto_1fr] items-center gap-2",
        props.hideCheckbox && "grid-cols-1",
      )}
    >
      <div class="grid gap-1">
        <div class="text-sub">{props.title}</div>
        <div class="text-text">{props.description}</div>
      </div>
      <input
        type="checkbox"
        class="text-2xl"
        checked={props.checked}
        disabled={props.disabled}
        hidden={props.hideCheckbox}
        onChange={(e) => props.onChange?.(e.currentTarget.checked)}
      />
    </label>
  );
}
