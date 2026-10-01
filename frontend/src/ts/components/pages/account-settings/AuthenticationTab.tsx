import { createSignal, Show } from "solid-js";

import {
  addAuthProvider,
  AuthMethod,
  getAuthMethodDisplay,
  getAuthMethodEmailReactive,
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
      description=<>
        Add password authentication, update your password or email.
      </>
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
          <Show when={hasAdditionalAuthMethodsReactive("password")}>
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
      description=<>
        Add or remove {getAuthMethodDisplay(props.authMethod)} authentication.
      </>
    >
      <div class="flex flex-col gap-2">
        <AuthEmail authMethod={props.authMethod} />
        <Show
          when={isUsingAuthenticationReactive(props.authMethod)}
          fallback=<Button
            class="w-full"
            text={`add ${getAuthMethodDisplay(props.authMethod)} authentication`}
            onClick={() =>
              void addAuthProvider({ authMethod: props.authMethod })
            }
          />
        >
          <Button
            class="w-full"
            text={`remove ${getAuthMethodDisplay(props.authMethod)} authentication`}
            disabled={!hasAdditionalAuthMethodsReactive(props.authMethod)}
            onClick={() =>
              showRemoveAuthMethodModal({ authMethod: props.authMethod })
            }
          />
        </Show>
      </div>
    </Section>
  );
}

function AuthEmail(props: { authMethod: AuthMethod }) {
  const [isRevealed, setIsRevealed] = createSignal(false);
  const email = () => getAuthMethodEmailReactive(props.authMethod);

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
