import { Show } from "solid-js";

import {
  addAuthProvider,
  getAuthMethodDisplay,
  getAuthMethodIcon,
  hasAdditionalAuthMethodsReactive,
  isUsingAuthenticationReactive,
  ProviderAuthMethod,
} from "../../../auth";
import { Button } from "../../common/Button";
import { showAddPasswordAuthModal } from "../../modals/account-settings/AddPasswordAuthModal";
import { showRevokeAllTokensModal } from "../../modals/account-settings/ReauthConfirmModals";
import { showRemoveAuthMethodModal } from "../../modals/account-settings/RemoveAuthMethodModal";
import { showUpdateEmailModal } from "../../modals/account-settings/UpdateEmailModal";
import { showUpdatePasswordModal } from "../../modals/account-settings/UpdatePasswordModal";
import { Section } from "./utils";

export function AuthenticationTab() {
  return (
    <>
      <PasswordAuthentication />
      <ProviderAuthentication authMethod="google" />
      <ProviderAuthentication authMethod="github" />
      <RevokeAllTokens />
    </>
  );
}

function PasswordAuthentication() {
  return (
    <Section
      title="password authentication settings"
      fa={getAuthMethodIcon("password")}
      text=<>Add password authentication, update your password or email.</>
    >
      <Show
        when={isUsingAuthenticationReactive("password")}
        fallback=<Button
          text="add password authentication"
          class="w-full"
          onClick={() => showAddPasswordAuthModal()}
        />
      >
        <div class="flex flex-col gap-2">
          <Button
            class="w-full"
            text="update email"
            onClick={() => showUpdateEmailModal()}
          />
          <Button
            class="w-full"
            text="update password"
            onClick={() => showUpdatePasswordModal()}
          />{" "}
          <Show when={() => hasAdditionalAuthMethodsReactive("password")}>
            <Button
              class="w-full"
              text="remove password authentication"
              onClick={() =>
                showRemoveAuthMethodModal({ authMethod: "password" })
              }
            />
          </Show>
        </div>
      </Show>
    </Section>
  );
}

function ProviderAuthentication(props: { authMethod: ProviderAuthMethod }) {
  return (
    <Section
      title={`${getAuthMethodDisplay(props.authMethod)}`}
      fa={getAuthMethodIcon(props.authMethod)}
      text=<>
        Add or remove {getAuthMethodDisplay(props.authMethod)} authentication.
      </>
      button={
        isUsingAuthenticationReactive(props.authMethod)
          ? {
              text: `remove ${getAuthMethodDisplay(props.authMethod)} authentication`,
              disabled: !hasAdditionalAuthMethodsReactive(props.authMethod),
              onClick: () =>
                showRemoveAuthMethodModal({ authMethod: props.authMethod }),
            }
          : {
              text: `add ${getAuthMethodDisplay(props.authMethod)} authentication`,
              onClick: () =>
                void addAuthProvider({ authMethod: props.authMethod }),
            }
      }
    />
  );
}

function RevokeAllTokens() {
  return (
    <Section
      title="revoke all tokens"
      fa={{ icon: "fa-user-slash" }}
      text=<>
        Revokes all tokens connected to your account. Do this if you think
        someone else has access to your account.
        <br />
        <span class="text-error">This will log you out of all devices.</span>
      </>
      button={{
        text: "revoke all tokens",
        class:
          "[--themable-button-bg:var(--error-color)] [--themable-button-text:var(--bg-color)]",
        onClick: () => showRevokeAllTokensModal(),
      }}
    />
  );
}
