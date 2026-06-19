import {
  isCapsLockOn as checkCapsLockOn,
  onCapsLockChange,
} from "@leonabcd123/modern-caps-lock";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { createSignal } from "solid-js";

type ModifierState = {
  shift: boolean;
  altGr: boolean;
  leftShift: boolean;
  rightShift: boolean;
};

export const [getModifierState, { updateModifierState }] =
  createSignalWithSetters<ModifierState>({
    shift: false,
    altGr: false,
    leftShift: false,
    rightShift: false,
  })({
    updateModifierState: (set, val: Partial<Omit<ModifierState, "shift">>) =>
      set((prev) => ({
        ...prev,
        ...val,
        shift: val.leftShift ?? val.rightShift ?? prev.shift,
      })),
  });

const [isCapsLockOn, setCapsLockOn] = createSignal<boolean>(checkCapsLockOn());
export { isCapsLockOn };

onCapsLockChange((state) => setCapsLockOn(state));
