import { createSignal } from "solid-js";
export const [getWpm, setWpm] = createSignal("0");
export const [getAcc, setAcc] = createSignal("100%");
export const [getBurst, setBurst] = createSignal("0");
export const [getFocus, setFocus] = createSignal(false);
export const [getTestRunning, setTestRunning] = createSignal(false);
