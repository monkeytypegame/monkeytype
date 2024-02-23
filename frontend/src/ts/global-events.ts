import * as Commandline from "./commandline/commandline";

function handleEscape(e: KeyboardEvent): void {
  Commandline.show();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    handleEscape(e);
  }
});
