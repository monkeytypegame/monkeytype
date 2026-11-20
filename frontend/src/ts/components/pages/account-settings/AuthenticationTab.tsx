import { createSignal, For, Show } from "solid-js";

import type { AuthMethodInfo } from "../../../auth/providers/types";

import { addAuthMethod } from "../../../auth/actions";
import {
  getAuthMethodEmail,
  hasOtherAuthMethods,
  isUsingAuthMethod,
} from "../../../auth/state";
import { getThirdParties, supportsPassword } from "../../../auth/system";
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
      <Show when={supportsPassword()}>
        <PasswordAuthentication />
      </Show>
      <For each={getThirdParties()}>
        {(thirdParty) => <ThirdPartyAuthentication thirdParty={thirdParty} />}
      </For>
      <RevokeAllTokens />
    </>
  );
}

function PasswordAuthentication() {
  return (
    <Section
      title="password authentication settings"
      fa={{ icon: "fa-lock" }}
      description=<>
        Add password authentication, update your password or email.
      </>
    >
      <Show
        when={isUsingAuthMethod("password")}
        fallback=<Button
          text="add password authentication"
          class="w-full"
          onClick={() => showAddPasswordAuthModal()}
        />
      >
        <div class="flex flex-col gap-2">
          <AuthEmail authMethod="password" />
          <Button
            class="w-full"
            text="update email"
            onClick={() => showUpdateEmailModal()}
          />
          <Button
            class="w-full"
            text="update password"
            onClick={() => showUpdatePasswordModal()}
          />
          <Show when={hasOtherAuthMethods("password")}>
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

function ThirdPartyAuthentication(props: { thirdParty: AuthMethodInfo }) {
  return (
    <Section
      title={props.thirdParty.display}
      fa={props.thirdParty.fa}
      description=<>Add or remove {props.thirdParty.display} authentication.</>
    >
      <div class="flex flex-col gap-2">
        <AuthEmail authMethod={props.thirdParty.id} />
        <Show
          when={isUsingAuthMethod(props.thirdParty.id)}
          fallback=<Button
            class="w-full"
            text={`add ${props.thirdParty.display} authentication`}
            onClick={() => void addAuthMethod({ method: props.thirdParty.id })}
          />
        >
          <Button
            class="w-full"
            text={`remove ${props.thirdParty.display} authentication`}
            disabled={!hasOtherAuthMethods(props.thirdParty.id)}
            onClick={() =>
              showRemoveAuthMethodModal({ authMethod: props.thirdParty.id })
            }
          />
        </Show>
      </div>
    </Section>
  );
}

function AuthEmail(props: { authMethod: string }) {
  const [isRevealed, setIsRevealed] = createSignal(false);
  const email = () => getAuthMethodEmail(props.authMethod);

  return (
    <Show when={email()}>
      {(value) => (
        <Button
          variant="text"
          class="w-full p-1 font-mono"
          fa={{ icon: isRevealed() ? "fa-eye-slash" : "fa-eye" }}
          text={isRevealed() ? value() : obfuscateEmail(value())}
          balloon={{
            text: isRevealed() ? "click to hide" : "click to reveal",
          }}
          onClick={() => setIsRevealed(!isRevealed())}
        />
      )}
    </Show>
  );
}

function obfuscateEmail(email: string): string {
  const atIndex = email.lastIndexOf("@");
  if (atIndex < 1) return maskAfterFirstCharacter(email);

  const domain = email.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf(".");
  const maskedDomain =
    dotIndex < 1
      ? maskAfterFirstCharacter(domain)
      : `${maskAfterFirstCharacter(domain.slice(0, dotIndex))}${domain.slice(dotIndex)}`;

  return `${maskAfterFirstCharacter(email.slice(0, atIndex))}@${maskedDomain}`;
}

function maskAfterFirstCharacter(value: string): string {
  if (value.length <= 1) return "\u2022".repeat(3);
  return `${value.slice(0, 1)}${"\u2022".repeat(value.length - 1)}`;
}

function RevokeAllTokens() {
  return (
    <Section
      title="revoke all tokens"
      fa={{ icon: "fa-user-slash" }}
      description=<>
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
