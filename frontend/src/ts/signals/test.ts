import { createSignal } from "solid-js";
import { VisibilityAnimationOptions } from "../hooks/useVisibilityAnimation";

export const [getWpm, setLiveStatWpm] = createSignal("0");
export const [getAcc, setLiveStatAcc] = createSignal("100%");
export const [getBurst, setLiveStatBurst] = createSignal("0");

export const [statsVisible, setStatsVisible] =
  createSignal<VisibilityAnimationOptions>({
    visible: false,
    animate: true,
  });
