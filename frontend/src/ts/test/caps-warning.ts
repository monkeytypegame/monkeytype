import Config from "../config";

const el = document.querySelector("#capsWarning") as HTMLElement;
const isMacOs = navigator.platform.startsWith("Mac");

export let capsState = false;

let visible = false;

function show(): void {
  if (!visible) {
    el?.classList.remove("hidden");
    visible = true;
  }
}

function hide(): void {
  if (visible) {
    el?.classList.add("hidden");
    visible = false;
  }
}

function update(event: JQuery.KeyDownEvent | JQuery.KeyUpEvent): void {
  const modState = event?.originalEvent?.getModifierState?.("CapsLock");
  if (modState !== undefined) {
    capsState = modState;
  }

  try {
    if (Config.capsLockWarning && capsState) {
      show();
    } else {
      hide();
    }
  } catch {}
}

$(document).on("keyup", update);

$(document).on("keydown", (event) => {
  if (isMacOs) update(event);
});
