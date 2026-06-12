import { For, JSX } from "solid-js";

import {
  AccountSettingsTab,
  accountSettingsTabs,
  getCurrentTab,
  setCurrentTab,
} from "../../../states/account-settings";
import { Button } from "../../common/Button";
import { AccountTab } from "./AccountTab";

const tabContent: Record<AccountSettingsTab, JSX.Element> = {
  account: <AccountTab />,
  authentication: <div>t.b.d</div>,
  blockedUsers: <div>t.b.d</div>,
  apeKeys: <div>t.b.d</div>,
  dangerZone: <div>t.b.d</div>,
};

export function AccountSettingsPage() {
  return (
    <div>
      <div class="content-grid flex flex-col gap-8 md:flex-row">
        <div class="w-full shrink-0 md:w-60 2xl:w-75">
          <Sidebar />
        </div>
        <div class="flex w-full flex-1 flex-col gap-8">
          {tabContent[getCurrentTab()]}
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div class="flex flex-col md:items-start gap-4 p-4 bg-sub-alt rounded-double">
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
