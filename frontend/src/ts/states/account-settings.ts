import { createSignal } from "solid-js";
import { z } from "zod";
import { createEffectOn } from "../hooks/effects";
import { FaSolidIcon } from "../types/font-awesome";
import { isAuthenticated } from "./core";

export const [getLastGeneratedApeKey, setLastGeneratedApeKey] = createSignal<
  string | undefined
>(undefined);

export const AccountSettingsTabSchema = z.enum([
  "account",
  "authentication",
  "blockedUsers",
  "apeKeys",
  "dangerZone",
]);
export type AccountSettingsTab = z.infer<typeof AccountSettingsTabSchema>;

export const accountSettingsTabs: Record<
  AccountSettingsTab,
  { icon: FaSolidIcon; text: string }
> = {
  account: { text: "account", icon: "fa-user" },
  authentication: { text: "authentication", icon: "fa-key" },
  blockedUsers: { text: "blocked users", icon: "fa-ban" },
  apeKeys: { text: "ape keys", icon: "fa-code" },
  dangerZone: { text: "danger zone", icon: "fa-exclamation-triangle" },
};

export const [isApeKeysDenied, setApeKeysDenied] = createSignal<
  boolean | undefined
>(undefined);

createEffectOn(isAuthenticated, (hasUser) => {
  if (!hasUser) {
    setApeKeysDenied(undefined);
  }
});

/** The account settings url search params, taking strings in. */
export const AccountSettingsSearchSchema = z.object({
  tab: AccountSettingsTabSchema.optional().catch(undefined),
});
