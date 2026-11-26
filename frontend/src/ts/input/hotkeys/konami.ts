import { createRoot } from "solid-js";
import { createHotkey } from "@tanstack/solid-hotkeys";

createRoot(() =>
  createHotkey(
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
