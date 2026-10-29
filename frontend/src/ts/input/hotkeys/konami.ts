import { createRoot } from "solid-js";
import { createHotkeySequence } from "@tanstack/solid-hotkeys";

createRoot(() =>
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
  ),
);
