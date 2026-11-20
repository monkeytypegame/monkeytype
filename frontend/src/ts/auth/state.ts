import { createSignal } from "solid-js";

export const [getUserId, setUserId] = createSignal<string | null>(null);
export const isAuthenticated = (): boolean => getUserId() !== null;
