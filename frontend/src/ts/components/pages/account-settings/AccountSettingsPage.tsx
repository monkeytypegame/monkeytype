import { For, JSX } from "solid-js";

import {
  AccountSettingsTab,
  accountSettingsTabs,
  getCurrentTab,
  setCurrentTab,
} from "../../../states/account-settings";
import { Button } from "../../common/Button";
import { Page } from "../../common/Page";
import { AccountTab } from "./AccountTab";
import { ApeKeysTab } from "./ApeKeysTab";
import { AuthenticationTab } from "./AuthenticationTab";
import { BlockedUsersTab } from "./BlockedUsersTab";
import { DangerZoneTab } from "./DangerZoneTab";

const tabContent: Record<AccountSettingsTab, JSX.Element> = {
  account: <AccountTab />,
  authentication: <AuthenticationTab />,
  blockedUsers: <BlockedUsersTab />,
  apeKeys: <ApeKeysTab />,
  dangerZone: <DangerZoneTab />,
};

export function AccountSettingsPage() {
  return (
    <Page id="accountSettings">
      <div class="content-grid flex flex-col gap-8 md:flex-row">
        <div class="w-full shrink-0 md:w-60">
          <Sidebar />
        </div>
        <div class="flex w-full flex-1 flex-col gap-8">
          {tabContent[getCurrentTab()]}
        </div>
      </div>
    </Page>
  );
}

function Sidebar() {
  return (
    <div class="flex flex-col gap-4 rounded-double bg-sub-alt p-4 md:items-start">
      <For each={Object.entries(accountSettingsTabs)}>
        {([key, tab]) => (
          <Button
            text={tab.text}
            variant="text"
            fa={{ icon: tab.icon }}
            active={getCurrentTab() === key}
            class="[--themable-button-active:var(--themable-button-text)]"
            onClick={() => setCurrentTab(key as AccountSettingsTab)}
          />
        )}
      </For>
    </div>
  );
}
