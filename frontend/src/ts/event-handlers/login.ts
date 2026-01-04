import * as ForgotPasswordModal from "../modals/forgot-password";

const loginPage = document.querySelector("#pageLogin") as HTMLElement;

loginPage?.addEventListener("click", (e) => {
  if ((e.target as Element).closest("#forgotPasswordButton")) {
    ForgotPasswordModal.show();
  }
});
