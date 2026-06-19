import { createSignal } from "solid-js";

// the current settings filter query, shared between the search input and the
// settings/sections that hide themselves when they don't match
export const [getSettingsSearch, setSettingsSearch] = createSignal("");

export const isSettingsSearchActive = (): boolean =>
  getSettingsSearch().trim() !== "";
