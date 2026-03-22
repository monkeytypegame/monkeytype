import type { Config } from "@monkeytype/schemas/configs";

export function isFirefoxBrowser(): boolean {
  if (typeof window === "undefined") return false;

  return window.navigator.userAgent.toLowerCase().includes("firefox");
}

export function getCommandLineModifierKeyLabel(): string {
  if (typeof window === "undefined") return "ctrl";

  const userAgent = window.navigator.userAgent.toLowerCase();

  return userAgent.includes("mac") && !isFirefoxBrowser() ? "cmd" : "ctrl";
}

export function getCommandLineKeyLabel(
  quickRestart: Config["quickRestart"],
): string {
  return quickRestart === "esc" ? "tab" : "esc";
}

export function getCommandLineKeybindHtml(
  quickRestart: Config["quickRestart"],
): string {
  const commandKey = getCommandLineKeyLabel(quickRestart);

  if (isFirefoxBrowser()) {
    return `<kbd>${commandKey}</kbd>`;
  }

  return `<kbd>${commandKey}</kbd> or <kbd>${getCommandLineModifierKeyLabel()}</kbd> + <kbd>shift</kbd> + <kbd>p</kbd>`;
}
