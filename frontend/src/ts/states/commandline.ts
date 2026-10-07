import { createSignal } from "solid-js";

import { CommandlineSubgroupKey, CommandsSubgroup } from "../commandline/types";
import { showModal } from "./modals";

export type CommandlineShowSettings = {
  subgroupOverride?: CommandsSubgroup | CommandlineSubgroupKey;
  commandOverride?: string;
};

export const [getCommandlineShowSettings, setCommandlineShowSettings] =
  createSignal<CommandlineShowSettings | null>(null);

export function showCommandline(settings?: CommandlineShowSettings): void {
  setCommandlineShowSettings(settings ?? null);
  showModal("Commandline");
}
