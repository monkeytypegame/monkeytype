import { updateModifierState } from "../states/modifiers";

document.addEventListener("keydown", (e: KeyboardEvent) => {
  handleKey(e, true);
});

document.addEventListener("keyup", (e: KeyboardEvent) => {
  handleKey(e, false);
});

function handleKey(e: KeyboardEvent, updateValue: boolean): void {
  if (e.code === "ShiftLeft") updateModifierState({ leftShift: updateValue });
  if (e.code === "ShiftRight") updateModifierState({ rightShift: updateValue });
  if (e.code === "AltRight" || e.code === "AltLeft") {
    updateModifierState({ altGr: updateValue });
  }
}
