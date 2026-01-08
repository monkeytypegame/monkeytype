import { createSignal } from "solid-js";

export const [getWpm, setLiveStatWpm] = createSignal("0");
export const [getAcc, setLiveStatAcc] = createSignal("100%");
export const [getBurst, setLiveStatBurst] = createSignal("0");
