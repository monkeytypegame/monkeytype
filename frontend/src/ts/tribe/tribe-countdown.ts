const el = $(".pageTest #typingTest .tribeCountdown");
const el2 = $(".pageTest #typingTest .tribeCountdown2");

export function update(value: string): void {
  el.text(value);
}

export function show(faded = false): void {
  el.removeClass("hidden");
  if (faded) {
    el.addClass("faded");
  }
}

export function hide(): void {
  el.addClass("hidden");
  el.removeClass("faded");
}

export function update2(value: string): void {
  el2.text(value);
}

export function show2(): void {
  el2.removeClass("hidden");
}

export function hide2(): void {
  el2.addClass("hidden");
}
