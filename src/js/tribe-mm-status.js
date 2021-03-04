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

export function reset() {
  this.setText("Tribe mm status");
  this.setIcon('<i class="fas fa-spin fa-circle-notch"></i>');
  this.hide();
}
