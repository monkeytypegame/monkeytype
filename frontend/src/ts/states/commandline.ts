import { createSignal } from "solid-js";
import { isLoadingShown } from "../components/core/PageSwitcher";
import { CommandlineSubgroupKey, CommandsSubgroup } from "../commandline/types";
import { showModal } from "./modals";

export type CommandlineShowSettings = {
  subgroupOverride?: CommandsSubgroup | CommandlineSubgroupKey;
  commandOverride?: string;
};

export const [getCommandlineShowSettings, setCommandlineShowSettings] =
  createSignal<CommandlineShowSettings | null>(null);

export function showCommandline(settings?: CommandlineShowSettings): void {
  if (isLoadingShown()) return;
  setCommandlineShowSettings(settings ?? null);
  showModal("Commandline");
}
