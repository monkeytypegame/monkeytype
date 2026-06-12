import { Show } from "solid-js";

import {
  addAuthProvider,
  AuthMethod,
  getAuthMethodDisplay,
  getAuthMethodIcon,
  hasAdditionalAuthMethodsReactive,
  isUsingAuthenticationReactive,
} from "../../../auth";
import { Button } from "../../common/Button";
import { showAddPasswordAuthModal } from "../../modals/account-settings/AddPasswordAuthModal";
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
        <UpdatePasswordAuthentication />
      </Show>
    </Section>
  );
}

function UpdatePasswordAuthentication() {
  return (
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
          onClick={() => showRemoveAuthMethodModal({ authMethod: "password" })}
        />
      </Show>
    </div>
  );
}

function ProviderAuthentication(props: { authMethod: AuthMethod }) {
  return (
    <Section
      title={`${getAuthMethodDisplay(props.authMethod)}`}
      fa={getAuthMethodIcon(props.authMethod)}
      text=<>
        Add or remove {getAuthMethodDisplay(props.authMethod)} authentication.
      </>
    >
      <Show
        when={isUsingAuthenticationReactive(props.authMethod)}
        fallback=<Button
          class="w-full"
          text={`add ${getAuthMethodDisplay(props.authMethod)} authentication`}
          onClick={() => void addAuthProvider(props.authMethod)}
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
    </Section>
  );
}
