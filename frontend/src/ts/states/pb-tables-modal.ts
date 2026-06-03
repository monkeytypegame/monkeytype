import { createSignal } from "solid-js";
import { Mode } from "@monkeytype/schemas/shared";

import { showModal } from "./modals";

const [pbTablesMode, setPbTablesMode] = createSignal<Mode>("time");

export { pbTablesMode };

export function showPbTablesModal(mode: Mode): void {
  setPbTablesMode(mode);
  showModal("PbTables");
}
