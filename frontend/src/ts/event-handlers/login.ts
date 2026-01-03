import * as ForgotPasswordModal from "../modals/forgot-password";
import { qs } from "../utils/dom";

const loginPage = qs("#pageLogin");

loginPage?.onChild("click", "#forgotPasswordButton", () => {
  ForgotPasswordModal.show();
});
