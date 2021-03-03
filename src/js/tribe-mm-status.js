let el = $("#tribeMatchmakingStatus");

export function show() {
  el.removeClass("hidden");
}

export function hide() {
  el.addClass("hidden");
}

export function updateText(text) {
  el.find(".text").text(text);
}

export function updateIcon(html) {
  el.find(".icon").html(html);
}
