import * as UI from "../ui";

export function loading(truefalse) {
  if (truefalse) {
    $("#top #menu .account .icon").html(
      '<i class="fas fa-fw fa-spin fa-circle-notch"></i>'
    );
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "none");
  } else {
    $("#top #menu .account .icon").html('<i class="fas fa-fw fa-user"></i>');
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "auto");
  }
}

export function update() {
  if (firebase.auth().currentUser != null) {
    UI.swapElements(
      $("#menu .icon-button.login"),
      $("#menu .icon-button.account"),
      250
    );
  } else {
    UI.swapElements(
      $("#menu .icon-button.account"),
      $("#menu .icon-button.login"),
      250
    );
  }
}
