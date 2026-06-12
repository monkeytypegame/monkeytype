import {
  showDeleteAccountModal,
  showResetAccountModal,
} from "../../modals/account-settings/ReauthConfirmModals";
import { Section } from "./utils";

export function DangerZoneTab() {
  return (
    <>
      <ResetAccount />
      <DeleteAccount />
    </>
  );
}

function ResetAccount() {
  return (
    <Section
      title="reset account"
      fa={{ icon: "fa-redo-alt" }}
      text=<>
        Completely resets your account to a blank state.
        <br />
        <span class="text-error">You can&apos;t undo this action!</span>
      </>
      button={{
        text: "reset account",
        class:
          "[--themable-button-bg:var(--error-color)] [--themable-button-text:var(--bg-color)]",
        onClick: () => showResetAccountModal(),
      }}
    />
  );
}

function DeleteAccount() {
  return (
    <Section
      title="delete account"
      fa={{ icon: "fa-trash" }}
      text=<>
        Deletes your account and all data connected to it.
        <br />
        <span class="text-error">You can&apos;t undo this action!</span>
      </>
      button={{
        text: "delete account",
        class:
          "[--themable-button-bg:var(--error-color)] [--themable-button-text:var(--bg-color)]",
        onClick: () => showDeleteAccountModal(),
      }}
    />
  );
}
