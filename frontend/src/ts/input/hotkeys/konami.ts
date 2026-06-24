import { createHotkeySequence } from "@tanstack/solid-hotkeys";

createHotkeySequence(
  [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "B",
    "A",
  ],
  () => {
    window.open("https://keymash.io/", "_blank");
  },
);
