let el = $("#tribeMatchmakingStatus");

export function show() {
  el.removeClass("hidden");
}

export function hide() {
  el.addClass("hidden");
}

export function setText(text) {
  el.find(".text").text(text);
}

export function setIcon(html) {
  el.find(".icon").html(html);
}
