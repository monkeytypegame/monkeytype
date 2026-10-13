import { For, JSXElement } from "solid-js";

import {
  AccountSettingsTab,
  accountSettingsTabs,
  useAccountSettingsTab,
} from "../../../states/account-settings";
import { Button } from "../../common/Button";
import { AccountTab } from "./AccountTab";
import { ApeKeysTab } from "./ApeKeysTab";
import { AuthenticationTab } from "./AuthenticationTab";
import { BlockedUsersTab } from "./BlockedUsersTab";
import { DangerZoneTab } from "./DangerZoneTab";

const tabContent: Record<AccountSettingsTab, () => JSXElement> = {
  account: () => <AccountTab />,
  authentication: () => <AuthenticationTab />,
  blockedUsers: () => <BlockedUsersTab />,
  apeKeys: () => <ApeKeysTab />,
  dangerZone: () => <DangerZoneTab />,
};

export function AccountSettingsPage() {
  const { tab } = useAccountSettingsTab();
  return (
    <div class="content-grid flex flex-col gap-8 md:flex-row">
      <div class="w-full shrink-0 md:w-60">
        <Sidebar />
      </div>
      <div class="flex w-full flex-1 flex-col gap-8">{tabContent[tab()]()}</div>
    </div>
  );
}

function Sidebar() {
  const { tab: currentTab, setTab } = useAccountSettingsTab();
  return (
    <div class="flex flex-col gap-4 rounded-double bg-sub-alt p-4 md:items-start">
      <For each={Object.entries(accountSettingsTabs)}>
        {([key, tab]) => (
          <Button
            text={tab.text}
            variant="text"
            fa={{ icon: tab.icon }}
            active={currentTab() === key}
            class="[--themable-button-active:var(--themable-button-text)]"
            onClick={() => setTab(key as AccountSettingsTab)}
          />
        )}
      </For>
    </div>
  );
}
