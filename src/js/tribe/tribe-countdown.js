let el = $(".pageTest #typingTest .tribeCountdown");

export function update(value) {
  el.text(value);
}

export function show() {
  el.removeClass("hidden");
}

export function hide() {
  el.addClass("hidden");
}
