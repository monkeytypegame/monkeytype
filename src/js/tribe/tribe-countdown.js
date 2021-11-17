let el = $(".pageTest #typingTest .tribeCountdown");

export function update(value) {
  el.text(value);
}

export function show(faded = false) {
  el.removeClass("hidden");
  if (faded) {
    el.addClass("faded");
  }
}

export function hide() {
  el.addClass("hidden");
  el.removeClass("faded");
}
