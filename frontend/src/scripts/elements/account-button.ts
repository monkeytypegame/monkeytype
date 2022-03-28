import { Auth } from "../firebase";
import * as Misc from "../utils/misc";

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
  if (Auth.currentUser != null) {
    Misc.swapElements(
      $("#menu .text-button.login"),
      $("#menu .text-button.account"),
      250
    );
  } else {
    Misc.swapElements(
      $("#menu .text-button.account"),
      $("#menu .text-button.login"),
      250
    );
  }
}
