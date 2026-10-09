import {
  isCapsLockOn as checkCapsLockOn,
  onCapsLockChange,
} from "@leonabcd123/modern-caps-lock";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { createSignal } from "solid-js";
import { createEffectOn } from "../hooks/effects";
import { getActivePage } from "./core";

type ModifierState = {
  shift: boolean;
  alt: boolean;
  leftShift: boolean;
  rightShift: boolean;
};

export const [getModifierState, { updateModifierState }] =
  createSignalWithSetters<ModifierState>({
    shift: false,
    alt: false,
    leftShift: false,
    rightShift: false,
  })({
    updateModifierState: (set, val: Partial<ModifierState>) =>
      set((prev) => {
        const leftShift = val.leftShift ?? prev.leftShift;
        const rightShift = val.rightShift ?? prev.rightShift;
        return {
          ...prev,
          ...val,
          leftShift,
          rightShift,
          shift: val.shift ?? (leftShift || rightShift),
        };
      }),
  });

export function resetModifierState(): void {
  updateModifierState({
    shift: false,
    alt: false,
    leftShift: false,
    rightShift: false,
  });
}

const [isCapsLockOn, setCapsLockOn] = createSignal<boolean>(checkCapsLockOn());
export { isCapsLockOn };

onCapsLockChange((state) => setCapsLockOn(state));

const listeners: Array<{ remove: () => void }> = [];

createEffectOn(getActivePage, (page) => {
  // Clean up listeners from previous page.
  for (const listener of listeners) {
    listener.remove();
  }
  // Ensure modifier state doesn't get stuck if keyup happens off-page.
  listeners.length = 0;

  resetModifierState();

  if (page === "test") {
    const onKeyDown = (e: KeyboardEvent): void => handleModifierState(e, true);
    const onKeyUp = (e: KeyboardEvent): void => handleModifierState(e, false);

    // Capture phase, so the state is up to date before the input handlers
    // (e.g. opposite shift mode) read it.
    document.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("keyup", onKeyUp, { capture: true });

    listeners.push(
      {
        remove: (): void =>
          document.removeEventListener("keydown", onKeyDown, { capture: true }),
      },
      {
        remove: (): void =>
          document.removeEventListener("keyup", onKeyUp, { capture: true }),
      },
    );
  }
});

function handleModifierState(e: KeyboardEvent, updateValue: boolean): void {
  if (e.code === "ShiftLeft") updateModifierState({ leftShift: updateValue });
  if (e.code === "ShiftRight") updateModifierState({ rightShift: updateValue });
  if (e.code === "AltRight" || e.code === "AltLeft") {
    updateModifierState({ alt: updateValue });
  }

  // Windows doesn't fire keyup for the first released shift while both are
  // held, leaving it stuck. shiftKey is reliable, so resync from it.
  const { leftShift, rightShift } = getModifierState();
  if (!e.shiftKey && (leftShift || rightShift)) {
    updateModifierState({ leftShift: false, rightShift: false });
  }
}
