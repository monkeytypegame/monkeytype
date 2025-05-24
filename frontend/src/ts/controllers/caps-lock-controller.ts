let isCapsLockOn = false;

document.addEventListener("keydown", (event: KeyboardEvent) => {
  isCapsLockOn = event.getModifierState("CapsLock");
});

export function getCapsLockState(): boolean {
  return isCapsLockOn;
}
