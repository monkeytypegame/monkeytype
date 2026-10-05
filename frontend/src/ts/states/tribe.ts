import { createSignal } from "solid-js";

export const [getIsInARoom, setIsInARoom] = createSignal(false);

export const [getTribeUserSettingsUserId, setTribeUserSettingsUserId] =
  createSignal<string | null>(null);
