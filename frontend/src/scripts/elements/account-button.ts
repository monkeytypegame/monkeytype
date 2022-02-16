import * as Misc from "../misc";

export function loading(truefalse: boolean): void {
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

export function update(): void {
  if (firebase.auth().currentUser != null) {
    Misc.swapElements(
      $("#menu .icon-button.login"),
      $("#menu .icon-button.account"),
      250
    );
  } else {
    Misc.swapElements(
      $("#menu .icon-button.account"),
      $("#menu .icon-button.login"),
      250
    );
  }
}
