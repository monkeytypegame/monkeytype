const SETTINGS_PAGE_SELECTOR = '[data-component="settingspage"]';

/**
 * Scrolls to a setting on the settings page and flashes it.
 * Shared by the settings search and the `?highlight=` deep-link handler.
 */
export function highlightSetting(key: string): void {
  const page = document.querySelector(SETTINGS_PAGE_SELECTOR);
  if (page === null) return;

  page
    .querySelector(".settings-highlight")
    ?.classList.remove("settings-highlight");

  const element = page.querySelector<HTMLElement>(
    `[data-setting-key="${CSS.escape(key)}"]`,
  );
  if (element === null) return;

  element.scrollIntoView({ block: "center", behavior: "auto" });
  // force a reflow so the flash animation restarts when re-highlighting
  element.getBoundingClientRect();
  element.classList.add("settings-highlight");
}
