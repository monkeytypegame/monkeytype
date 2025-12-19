import * as ForgotPasswordModal from "../modals/forgot-password";

const loginPage = document.querySelector("#pageLogin") as HTMLElement;

$(loginPage).on("click", "#forgotPasswordButton", () => {
  ForgotPasswordModal.show();
});
