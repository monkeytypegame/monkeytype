import { useRouteSearch } from "../../../router/search-params";
import { AccountSettingsTab } from "../../../states/account-settings";

/**
 * The account settings tab, kept in the url. Writes replace the url (no
 * history entry) and are ignored once the route is left.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- inferred
export function useAccountSettingsTab() {
  const { search, replace } = useRouteSearch("/account-settings");

  return {
    tab: (): AccountSettingsTab => search().tab ?? "account",
    setTab: (tab: AccountSettingsTab): void => replace(() => ({ tab })),
  };
}
