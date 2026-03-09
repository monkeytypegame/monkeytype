import { createSignal, JSXElement } from "solid-js";

import { signIn, signInWithGitHub, signInWithGoogle } from "../../../auth";
import * as ForgotPasswordModal from "../../../modals/forgot-password";
import * as ConnectionState from "../../../states/connection";
import {
  showLoginPageLoader,
  hideLoginPageLoader,
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
} from "../../../stores/login";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../../stores/notifications";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import { Separator } from "../../common/Separator";

export function Login(): JSXElement {
  const [loginEmail, setLoginEmail] = createSignal("");
  const [loginPassword, setLoginPassword] = createSignal("");
  const [rememberMe, setRememberMe] = createSignal(true);

  const handleSignInWithGoogle = async () => {
    if (!ConnectionState.get()) {
      showNoticeNotification("You are offline");
      return;
    }
    showLoginPageLoader();
    disableLoginPageInputs();
    const data = await signInWithGoogle(rememberMe());
    hideLoginPageLoader();
    if (!data.success) {
      showErrorNotification("Failed to sign in with Google: " + data.message);
      enableLoginPageInputs();
    }
  };

  const handleSignInWithGitHub = async () => {
    if (!ConnectionState.get()) {
      showNoticeNotification("You are offline");
      return;
    }
    showLoginPageLoader();
    disableLoginPageInputs();
    const data = await signInWithGitHub(rememberMe());
    hideLoginPageLoader();
    if (!data.success) {
      showErrorNotification("Failed to sign in with GitHub: " + data.message);
      enableLoginPageInputs();
    }
  };

  const handleSignIn = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!ConnectionState.get()) {
      showNoticeNotification("You are offline");
      return;
    }
    if (loginEmail() === "" || loginPassword() === "") {
      showNoticeNotification("Please fill in all fields");
      return;
    }
    showLoginPageLoader();
    disableLoginPageInputs();
    const data = await signIn(loginEmail(), loginPassword(), rememberMe());
    hideLoginPageLoader();
    if (!data.success) {
      showErrorNotification("Failed to sign in: " + data.message);
      enableLoginPageInputs();
    }
  };

  return (
    <div class="grid w-full grid-cols-1 justify-center gap-2 sm:w-80">
      <H3
        text="login"
        fa={{
          icon: "fa-sign-in-alt",
        }}
        class="p-0"
      />
      <div class="grid grid-cols-2 gap-4">
        <Button
          fa={{
            icon: "fa-google",
            variant: "brand",
          }}
          disabled={!getLoginPageInputsEnabled()}
          onClick={handleSignInWithGoogle}
        />
        <Button
          fa={{
            icon: "fa-github",
            variant: "brand",
          }}
          disabled={!getLoginPageInputsEnabled()}
          onClick={handleSignInWithGitHub}
        />
      </div>
      <form class="grid w-full gap-2" onSubmit={handleSignIn}>
        <Separator text="or" />
        <input
          name="current-email"
          type="email"
          placeholder="email"
          // oxlint-disable-next-line react/no-unknown-property
          autocomplete="current-email"
          disabled={!getLoginPageInputsEnabled()}
          onInput={(e) => setLoginEmail(e.target.value)}
        />
        <input
          name="current-password"
          type="password"
          placeholder="password"
          // oxlint-disable-next-line react/no-unknown-property
          autocomplete="current-password"
          disabled={!getLoginPageInputsEnabled()}
          onInput={(e) => setLoginPassword(e.target.value)}
        />
        <div>
          <label class="flex h-6 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe()}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={!getLoginPageInputsEnabled()}
            />
            <div>remember me</div>
          </label>
        </div>
        <Button
          type="submit"
          class="signIn"
          disabled={!getLoginPageInputsEnabled()}
          fa={{
            icon: "fa-sign-in-alt",
          }}
          text="sign in"
        />
      </form>
      <Button
        variant="text"
        class="w-max justify-self-end text-xs"
        text="forgot password?"
        onClick={() => ForgotPasswordModal.show()}
        disabled={!getLoginPageInputsEnabled()}
      />
    </div>
  );
}
