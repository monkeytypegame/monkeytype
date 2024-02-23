import * as Commandline from "./commandline/commandline";

function handleEscape(e: KeyboardEvent): void {
  Commandline.toggle();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    handleEscape(e);
  }
});
