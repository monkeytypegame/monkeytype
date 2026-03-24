import { Config } from "../config/store";
import { toggleQuoteTag, setQuoteTags } from "../config/setters";
import { QUOTE_TAGS, type QuoteTag } from "@monkeytype/schemas/quotes";
import AnimatedModal from "../utils/animated-modal";
import { getActivePage, restartTestEvent } from "../states/core";
import * as TestState from "../test/test-state";
import QuotesController from "../controllers/quotes-controller";

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
let modalPillsBuilt = false;

//  DOM references

function getWrapper(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".quoteTagFilter");
}

function getTrigger(): HTMLButtonElement | null {
  return document.getElementById(
    "quoteTagFilterTrigger",
  ) as HTMLButtonElement | null;
}

function getPillsContainer(): HTMLElement | null {
  return document.getElementById("quoteTagFilterModalPills");
}

function getClearBtn(): HTMLButtonElement | null {
  return document.getElementById(
    "quoteTagFilterModalClearBtn",
  ) as HTMLButtonElement | null;
}

function maybeRestartTestForQuoteTagChange(): void {
  // Regenerate quotes when changing tag filters pre-test.
  if (getActivePage() !== "test") return;
  if (Config.mode !== "quote") return;
  if (TestState.isActive) return;
  restartTestEvent.dispatch();
}

const quoteTagFilterModal = new AnimatedModal({
  dialogId: "quoteTagFilterModal",
  setup: async (modalEl): Promise<void> => {
    modalEl
      .qs<HTMLButtonElement>("#quoteTagFilterModalClearBtn")
      ?.on("click", (e) => {
        e.stopPropagation();
        setQuoteTags([]);
        syncPills();
        syncLabel();
        syncClearBtn();
        maybeRestartTestForQuoteTagChange();
      });
  },
  cleanup: async (): Promise<void> => {
    const trigger = getTrigger();
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.classList.remove("active");
  },
});

//  Pill builder

function buildPills(): void {
  const container = getPillsContainer();
  if (!container) return;

  container.innerHTML = "";
  const active = new Set(Config.quoteTags);
  const available = QuotesController.getAvailableTags(Config.quoteLength);

  for (const tag of QUOTE_TAGS) {
    container.appendChild(createPill(tag, active.has(tag), available.has(tag)));
  }
}

function createPill(
  tag: QuoteTag,
  active: boolean,
  isEnabled: boolean,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `textButton quoteTagPill${active ? " active" : ""}`;

  if (!isEnabled) {
    btn.classList.add("disabled");
    btn.disabled = true;
  }

  btn.dataset["tag"] = tag;
  btn.setAttribute("aria-pressed", String(active));
  btn.title = isEnabled
    ? TAG_LABELS[tag]
    : `${TAG_LABELS[tag]} (no quotes found with current length)`;

  btn.innerHTML = `
    <i class="fas ${TAG_ICONS[tag]}" aria-hidden="true"></i>
    <span>${TAG_LABELS[tag]}</span>
  `;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isEnabled) return;
    toggleQuoteTag(tag);

    if (quoteTagFilterModal.isOpen()) syncPills();

    syncLabel();
    syncClearBtn();
    maybeRestartTestForQuoteTagChange();
  });

  return btn;
}

// Sync helpers (keep DOM in step with Config)

function syncPills(): void {
  const container = getPillsContainer();
  if (!container) return;

  const active = new Set(Config.quoteTags);
  const available = QuotesController.getAvailableTags(Config.quoteLength);

  container
    .querySelectorAll<HTMLButtonElement>(".quoteTagPill")
    .forEach((btn) => {
      const tag = btn.dataset["tag"] as QuoteTag | undefined;
      if (!tag) return;
      const on = active.has(tag);
      const isEnabled = available.has(tag);

      btn.classList.toggle("active", on);
      btn.classList.toggle("disabled", !isEnabled);
      btn.disabled = !isEnabled;
      btn.setAttribute("aria-pressed", String(on));
      btn.title = isEnabled
        ? TAG_LABELS[tag]
        : `${TAG_LABELS[tag]} (no quotes found with current length)`;
    });
}

/**
 * Updates the trigger button label. Shows "all tags" when nothing is selected, or a comma list up to 2 tags followed by " +N" when there are more.
 */
function syncLabel(): void {
  const trigger = getTrigger();
  const label = trigger?.querySelector<HTMLSpanElement>(".quoteTagFilterLabel");
  const icon = trigger?.querySelector<HTMLElement>("i:first-child");
  if (!label || !icon) return;

  const tags = Config.quoteTags;

  if (tags.length === 0) {
    label.textContent = "all tags";
    icon.className = "fas fa-fw fa-tags";
    return;
  }

  const firstTag = tags[0] as QuoteTag;
  const tagName = TAG_LABELS[firstTag];
  const extra = tags.length > 1 ? ` +${tags.length - 1}` : "";

  label.textContent = tagName + extra;
  icon.className = `fas fa-fw ${TAG_ICONS[firstTag]}`;
}

function syncClearBtn(): void {
  const hasTags = Config.quoteTags.length > 0;
  const clearBtn = getClearBtn();
  if (clearBtn) {
    clearBtn.style.visibility = hasTags ? "visible" : "hidden";
    clearBtn.setAttribute("aria-disabled", String(!hasTags));
  }
}

//  Public API

/**
 * Call this once after the DOM is ready to wire up the trigger and clear button event listeners.
 */
export function init(): void {
  modalPillsBuilt = false;

  if (quoteTagFilterModal.isOpen()) {
    void quoteTagFilterModal.hide();
  }

  const trigger = getTrigger();
  const clearBtn = getClearBtn();

  if (initialized) {
    syncLabel();
    syncClearBtn();
    return;
  }

  trigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (quoteTagFilterModal.isOpen()) {
      closeModal();
      return;
    }
    openModal();
  });

  clearBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    setQuoteTags([]);
    syncPills();
    syncLabel();
    syncClearBtn();
    maybeRestartTestForQuoteTagChange();
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
    closeModal();
  }
}

/**
 * Call this whenever Config.quoteTags changes externally.
 */
export function update(): void {
  modalPillsBuilt = false;

  if (quoteTagFilterModal.isOpen()) {
    buildPills();
    modalPillsBuilt = true;
  }

  syncLabel();
  syncClearBtn();
}

function openModal(): void {
  if (quoteTagFilterModal.isOpen()) return;

  modalPillsBuilt = false;

  const trigger = getTrigger();
  trigger?.setAttribute("aria-expanded", "true");
  trigger?.classList.add("active");

  void quoteTagFilterModal.show({
    beforeAnimation: async () => {
      if (!modalPillsBuilt) {
        buildPills();
        modalPillsBuilt = true;
      }
    },
  });
}

function closeModal(): void {
  if (!quoteTagFilterModal.isOpen()) return;

  const trigger = getTrigger();
  trigger?.setAttribute("aria-expanded", "false");
  trigger?.classList.remove("active");

  modalPillsBuilt = false;
  void quoteTagFilterModal.hide();
}
