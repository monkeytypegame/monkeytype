import { createSignal } from "solid-js";
import { z } from "zod";
import { createEffectOn } from "../hooks/effects";
import { FaSolidIcon } from "../types/font-awesome";
import { getActivePage, isAuthenticated } from "./core";
import { serialize as serializeUrlSearchParams } from "zod-urlsearchparams";

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
  blockedUsers: { text: "blocked users", icon: "fa-user-shield" },
  apeKeys: { text: "ape keys", icon: "fa-code" },
  dangerZone: { text: "danger zone", icon: "fa-exclamation-triangle" },
};

export const AccountSettingsUrlParamsSchema = z
  .object({
    tab: AccountSettingsTabSchema,
  })
  .partial();
export type AccountSettingsUrlParams = z.infer<
  typeof AccountSettingsUrlParamsSchema
>;

export const [getCurrentTab, setCurrentTab] =
  createSignal<AccountSettingsTab>("account");

export const [isApeKeysDenied, setApeKeysDenied] = createSignal<
  boolean | undefined
>(undefined);

createEffectOn(isAuthenticated, (hasUser) => {
  if (!hasUser) {
    setApeKeysDenied(undefined);
  }
});

export function readAccountSettingsGetParameters(
  params: AccountSettingsUrlParams | undefined,
): void {
  if (params === undefined || params.tab === undefined) return;

  setCurrentTab(params.tab);
}

createEffectOn(getCurrentTab, (tab) => {
  //make sure we only replace the url if we are on the accountSettings page. If this is missing the url-handler will not work correctly
  if (getActivePage() !== "accountSettings") return;
  const data: AccountSettingsUrlParams = { tab };

  const urlParams = serializeUrlSearchParams({
    schema: AccountSettingsUrlParamsSchema,
    data,
  });
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.replaceState({}, "", newUrl);
});
