import { createSignal } from "solid-js";
import { FaIcon } from "../types/font-awesome";

export const [getLastGeneratedApeKey, setLastGeneratedApeKey] = createSignal<
  string | undefined
>(undefined);

export const accountSettingsTabs = {
  account: { text: "account", icon: "fa-user" },
  authentication: { text: "authentication", icon: "fa-key" },
  blockedUsers: { text: "blocked users", icon: "fa-user-shield" },
  apeKeys: { text: "ape keys", icon: "fa-code" },
  dangerZone: { text: "danger zone", icon: "fa-exclamation-triangle" },
} as const satisfies Record<string, { icon: FaIcon; text: string }>;

export type AccountSettingsTab = keyof typeof accountSettingsTabs;

export const [getCurrentTab, setCurrentTab] =
  createSignal<AccountSettingsTab>("apeKeys");
