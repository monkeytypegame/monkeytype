import Config from "../config";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";
import * as Numbers from "@monkeytype/util/numbers";
import type jQuery from "jquery";

declare const $: typeof jQuery;

const textElement = document.querySelector(
  "#liveStatsTextBottom .liveSpeed"
) as HTMLElement;
const miniElement = document.querySelector(
  "#liveStatsMini .speed"
) as HTMLElement;

let potentialButton: HTMLButtonElement | null = null;
let potentialPopup: HTMLDivElement | null = null;

function createPotentialPopup(): HTMLDivElement {
  const popup = document.createElement("div");
  popup.className = "potential-wpm-popup";
  popup.style.display = "none";
  return popup;
}

function handlePotentialButtonClick(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  const button = event.currentTarget as HTMLButtonElement;
  const potentialWpm = parseFloat(button.dataset["potentialWpm"] ?? "0");
  const officialWpm = parseFloat(button.dataset["officialWpm"] ?? "0");
  const swapCount = parseInt(button.dataset["swapCount"] ?? "0", 10);

  if (!potentialPopup) {
    potentialPopup = createPotentialPopup();
    document.body.appendChild(potentialPopup);
  }

  if (swapCount <= 0) {
    potentialPopup.innerHTML = "No swap errors";
    potentialPopup.style.display = "block";
    setTimeout(() => {
      if (potentialPopup) potentialPopup.style.display = "none";
    }, 2000);
    return;
  }

  const potentialText = Format.typingSpeed(potentialWpm, {
    showDecimalPlaces: true,
  });
  const diff = Numbers.roundTo2(potentialWpm - officialWpm);
  const errorLabel = swapCount === 1 ? "swap" : "swaps";

  potentialPopup.innerHTML = `
    <div class="potential-wpm-info">
      <div class="potential-value">${potentialText}</div>
      <div class="potential-detail">+${diff.toFixed(
        2
      )} (${swapCount} ${errorLabel})</div>
    </div>
  `;

  // Position popup below button
  const rect = button.getBoundingClientRect();
  potentialPopup.style.left = `${rect.left}px`;
  potentialPopup.style.top = `${rect.bottom + 5}px`;
  potentialPopup.style.display = "block";

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (potentialPopup) potentialPopup.style.display = "none";
  }, 3000);
}

// Close popup when clicking outside
document.addEventListener("click", (e) => {
  if (
    potentialPopup &&
    e.target !== potentialButton &&
    !potentialPopup.contains(e.target as Node)
  ) {
    potentialPopup.style.display = "none";
  }
});

function ensurePotentialButton(): HTMLButtonElement | null {
  textElement.classList.add("has-potential-wpm");
  if (!potentialButton) {
    potentialButton = document.createElement("button");
    potentialButton.type = "button";
    potentialButton.className = "potential-wpm-button";
    potentialButton.textContent = "";
    potentialButton.addEventListener("click", handlePotentialButtonClick);
  }
  if (!textElement.contains(potentialButton)) {
    textElement.appendChild(potentialButton);
  }
  return potentialButton;
}

export function reset(): void {
  textElement.innerHTML = "0";
  const button = ensurePotentialButton();
  if (button) {
    button.setAttribute("aria-label", "Potential: 0");
    button.setAttribute("data-balloon-pos", "down");
  }
  miniElement.innerHTML = "0";
}

export function update(
  wpm: number,
  raw: number,
  potential: number,
  minorSwapErrors: number
): void {
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  const numberText = Format.typingSpeed(number, { showDecimalPlaces: false });
  textElement.innerHTML = numberText;
  miniElement.innerHTML = numberText;

  const button = ensurePotentialButton();
  if (button) {
    const potentialText = Format.typingSpeed(potential, {
      showDecimalPlaces: true,
    });
    button.setAttribute("aria-label", `Potential: ${potentialText}`);
    button.setAttribute("data-balloon-pos", "down");
    button.dataset["swapCount"] = minorSwapErrors.toString();
    button.dataset["potentialWpm"] = potential.toString();
    button.dataset["officialWpm"] = wpm.toString();
    button.classList.toggle("hidden", minorSwapErrors <= 0);
    textElement.appendChild(button);
  }
}

let state = false;

export function show(): void {
  if (Config.liveSpeedStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.liveSpeedStyle === "mini") {
    $(miniElement)
      .stop(true, false)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125
      );
  } else {
    $(textElement)
      .stop(true, false)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125
      );
  }
  state = true;
}

export function hide(): void {
  if (!state) return;
  $(textElement)
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        textElement.classList.add("hidden");
      }
    );
  $(miniElement)
    .stop(true, false)
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        miniElement.classList.add("hidden");
      }
    );
  state = false;
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "liveSpeedStyle") eventValue === "off" ? hide() : show();
});
