import { ElementWithUtils, qs } from "../utils/dom";

// queried lazily - test page dom is rendered after module load
const getEl = (): ElementWithUtils | null =>
  qs(".pageTest #typingTest .tribeCountdown");
const getEl2 = (): ElementWithUtils | null =>
  qs(".pageTest #typingTest .tribeCountdown2");

export function update(value: string): void {
  getEl()?.setText(value);
}

export function show(faded = false): void {
  getEl()?.removeClass("hidden");
  if (faded) {
    getEl()?.addClass("faded");
  }
}

export function hide(): void {
  getEl()?.addClass("hidden");
  getEl()?.removeClass("faded");
}

export function update2(value: string): void {
  getEl2()?.setText(value);
}

export function show2(): void {
  getEl2()?.removeClass("hidden");
}

export function hide2(): void {
  getEl2()?.addClass("hidden");
}
