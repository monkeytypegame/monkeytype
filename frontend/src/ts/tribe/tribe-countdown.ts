const el = $(".pageTest #typingTest .tribeCountdown");

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
