import { Config } from "../config/store";
import { toggleQuoteTag, setQuoteTags } from "../config/setters";
import { QUOTE_TAGS, type QuoteTag } from "@monkeytype/schemas/quotes";

const TAG_LABELS: Record<QuoteTag, string> = {
  fiction: "Fiction",
  poetry: "Poetry",
  philosophy: "Philosophy",
  political: "Political",
  inspirational: "Inspirational",
  wisdom: "Wisdom",
  mindset: "Mindset",
  humorous: "Humorous",
};

const TAG_ICONS: Record<QuoteTag, string> = {
  fiction: "fa-book-open",
  poetry: "fa-feather-alt",
  philosophy: "fa-brain",
  political: "fa-landmark",
  inspirational: "fa-bolt",
  wisdom: "fa-scroll",
  mindset: "fa-seedling",
  humorous: "fa-laugh",
};

let initialized = false;
let pillsBuilt = false;
let isOpen = false;

//  DOM references

function getWrapper(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".quoteTagFilter");
}

function getTrigger(): HTMLButtonElement | null {
  return document.getElementById(
    "quoteTagFilterTrigger",
  ) as HTMLButtonElement | null;
}

function getDropdown(): HTMLElement | null {
  return document.getElementById("quoteTagFilterDropdown");
}

function getPillsContainer(): HTMLElement | null {
  return document.getElementById("quoteTagFilterPills");
}

function getClearBtn(): HTMLButtonElement | null {
  return document.getElementById(
    "quoteTagFilterClearBtn",
  ) as HTMLButtonElement | null;
}

//  Open / close

function open(): void {
  if (isOpen) return;

  if (!pillsBuilt) {
    buildPills();
    pillsBuilt = true;
  }

  isOpen = true;

  const trigger = getTrigger();
  const dropdown = getDropdown();
  trigger?.setAttribute("aria-expanded", "true");
  trigger?.classList.add("active");
  dropdown?.classList.add("open");

  // Close when the user clicks outside the dropdown
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
  }, 0);
}

function close(): void {
  if (!isOpen) return;
  isOpen = false;

  const trigger = getTrigger();
  const dropdown = getDropdown();
  trigger?.setAttribute("aria-expanded", "false");
  trigger?.classList.remove("active");
  dropdown?.classList.remove("open");

  document.removeEventListener("click", handleOutsideClick);
  document.removeEventListener("keydown", handleEscape);
}

function toggle(): void {
  isOpen ? close() : open();
}

function handleOutsideClick(e: MouseEvent): void {
  const wrapper = getWrapper();
  if (wrapper && !wrapper.contains(e.target as Node)) {
    close();
  }
}

function handleEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    close();
    getTrigger()?.focus();
  }
}

//  Pill builder

function buildPills(): void {
  const container = getPillsContainer();
  if (!container) return;

  container.innerHTML = "";
  const active = new Set(Config.quoteTags);

  for (const tag of QUOTE_TAGS) {
    container.appendChild(createPill(tag, active.has(tag)));
  }
}

function createPill(tag: QuoteTag, active: boolean): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `textButton quoteTagPill${active ? " active" : ""}`;
  btn.dataset["tag"] = tag;
  btn.setAttribute("aria-pressed", String(active));
  btn.title = TAG_LABELS[tag];

  btn.innerHTML = `
    <i class="fas ${TAG_ICONS[tag]}" aria-hidden="true"></i>
    <span>${TAG_LABELS[tag]}</span>
  `;

  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // don't bubble to the outside-click handler
    toggleQuoteTag(tag);
    syncPills();
    syncLabel();
    syncClearBtn();
  });

  return btn;
}

// Sync helpers (keep DOM in step with Config)

function syncPills(): void {
  const container = getPillsContainer();
  if (!container) return;

  const active = new Set(Config.quoteTags);

  container
    .querySelectorAll<HTMLButtonElement>(".quoteTagPill")
    .forEach((btn) => {
      const tag = btn.dataset["tag"] as QuoteTag | undefined;
      if (!tag) return;
      const on = active.has(tag);
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
}

/**
 * Updates the trigger button label. Shows "all tags" when nothing is selected, or a comma list up to 2 tags followed by " +N" when there are more.
 */
function syncLabel(): void {
  const label = getTrigger()?.querySelector<HTMLSpanElement>(
    ".quoteTagFilterLabel",
  );
  if (!label) return;

  const tags = Config.quoteTags;

  if (tags.length === 0) {
    label.textContent = "all tags";
    return;
  }

  const shown = tags
    .slice(0, 2)
    .map((t) => TAG_LABELS[t])
    .join(", ");
  const extra = tags.length > 2 ? ` +${tags.length - 2}` : "";
  label.textContent = shown + extra;
}

function syncClearBtn(): void {
  const btn = getClearBtn();
  if (!btn) return;
  const hasTags = Config.quoteTags.length > 0;
  btn.style.visibility = hasTags ? "visible" : "hidden";
  btn.setAttribute("aria-disabled", String(!hasTags));
}

//  Public API

/**
 * Call this once after the DOM is ready to wire up the trigger and clear button event listeners.
 */
export function init(): void {
  // Always reset pillsBuilt because the DOM might have been replaced
  pillsBuilt = false;
  isOpen = false;

  const trigger = getTrigger();
  const clearBtn = getClearBtn();

  if (initialized) {
    syncLabel();
    syncClearBtn();
    return;
  }

  trigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  clearBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    setQuoteTags([]);
    syncPills();
    syncLabel();
    syncClearBtn();
  });

  syncLabel();
  syncClearBtn();
  initialized = true;
}

/**
 * Shows the filter block only in quote mode.
 */
export function setVisible(visible: boolean): void {
  const wrapper = getWrapper();
  if (!wrapper) return;

  if (visible) {
    wrapper.classList.remove("hidden");
  } else {
    wrapper.classList.add("hidden");
    close();
  }
}

/**
 * Call this whenever Config.quoteTags changes externally so the dropdown stays in sync without needing to be open.
 */
export function update(): void {
  pillsBuilt = false;

  if (isOpen) {
    buildPills();
    pillsBuilt = true;
  }

  syncLabel();
  syncClearBtn();
}
