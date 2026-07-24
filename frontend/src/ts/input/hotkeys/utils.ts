import {
  CreateHotkeyOptions,
  CreateHotkeyDefinition,
  Hotkey,
  HotkeyCallback,
  HotkeyCallbackContext,
  createHotkey as registerHotkey,
  createHotkeys as registerHotkeys,
} from "@tanstack/solid-hotkeys";
import { isAnyPopupVisible } from "../../utils/misc";
import { isInputElementFocused } from "../input-element";
import * as CompositionState from "../../legacy-states/composition";

export const NoKey = "" as Hotkey;

const defaultOptions: CreateHotkeyOptions = {
  ignoreInputs: false, //hotkeys are active on the words input, but not on other interactive elements
  stopPropagation: false, //we set stopPropagation in the callback if the hotkey executes
  preventDefault: false, //we set preventDefault in the callback if the hotkey executes
  requireReset: true,
  conflictBehavior: "replace",
};

const beforeCallback: ProxyHandler<HotkeyCallback> = {
  apply(
    target: (event: KeyboardEvent, callback: HotkeyCallbackContext) => void,
    thisArg: Window,
    args: [KeyboardEvent, HotkeyCallbackContext],
  ) {
    const [e, context] = args;
    if (handleHotkeyOnInteractiveElement(e, context)) return;
    e.stopPropagation();
    e.preventDefault();
    Reflect.apply(target, thisArg, args);
  },
};

export function createHotkey(
  hotkey: Hotkey | (() => Hotkey),
  callback: HotkeyCallback,
  options: () => Partial<
    Omit<
      CreateHotkeyOptions,
      "ignoreInputs" | "stopPropagation" | "preventDefault"
    >
  > = () => ({}),
): void {
  registerHotkey(hotkey, new Proxy(callback, beforeCallback), () => ({
    ...defaultOptions,
    enabled: (typeof hotkey === "function" ? hotkey() : hotkey) !== NoKey,
    ...options(),
  }));
}

export function createHotkeys(
  hotkeys: CreateHotkeyDefinition[] | (() => CreateHotkeyDefinition[]),
  commonOptions: () => Partial<
    Omit<
      CreateHotkeyOptions,
      "ignoreInputs" | "stopPropagation" | "preventDefault"
    >
  > = () => ({}),
): void {
  const modifiedHotkeys = (): CreateHotkeyDefinition[] => {
    const resolvedHotkeys = typeof hotkeys === "function" ? hotkeys() : hotkeys;
    resolvedHotkeys.forEach((hotkey) => {
      hotkey.callback = new Proxy(hotkey.callback, beforeCallback);
      hotkey.options ??= {};
      hotkey.options.enabled ??= hotkey.hotkey !== NoKey;
    });
    return resolvedHotkeys;
  };
  registerHotkeys(modifiedHotkeys, () => ({
    ...defaultOptions,
    ...commonOptions(),
  }));
}

function isInteractiveElementFocused(): boolean {
  if (isInputElementFocused()) return false;

  return (
    document.activeElement?.tagName === "A" ||
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA" ||
    document.activeElement?.tagName === "SELECT" ||
    document.activeElement?.tagName === "BUTTON" ||
    document.activeElement?.classList.contains("button") === true ||
    document.activeElement?.classList.contains("textButton") === true ||
    document.activeElement?.classList.contains("modal") === true
  );
}

function handleHotkeyOnInteractiveElement(
  e: KeyboardEvent,
  { hotkey }: HotkeyCallbackContext,
): boolean {
  if (
    (hotkey === "Tab" || hotkey === "Enter") &&
    isInteractiveElementFocused()
  ) {
    return true;
  } else if (hotkey === "Escape" && isAnyPopupVisible()) {
    return true;
  } else if (
    hotkey === "Escape" &&
    isInputElementFocused() &&
    CompositionState.getData() !== ""
  ) {
    return true;
  }

  return false;
}
