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
    <div class="grid grid-cols-1 justify-center gap-2">
      <div class="inline-flex items-baseline text-sub">
        <i class="fas fa-sign-in-alt mr-[0.5em]"></i>
        login
      </div>
      <div class="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={!getLoginPageInputsEnabled()}
          onClick={handleSignInWithGoogle}
        >
          <i class="fab fa-google"></i>
        </button>
        <button
          type="button"
          disabled={!getLoginPageInputsEnabled()}
          onClick={handleSignInWithGitHub}
        >
          <i class="fab fa-github"></i>
        </button>
      </div>
      <form class="grid w-full gap-2" onSubmit={handleSignIn}>
        <Separator text="or" />
        <input
          name="current-email"
          type="email"
          class="w-68"
          placeholder="email"
          // oxlint-disable-next-line react/no-unknown-property
          autocomplete="current-email"
          disabled={!getLoginPageInputsEnabled()}
          onInput={(e) => setLoginEmail(e.target.value)}
        />
        <input
          name="current-password"
          type="password"
          class="w-68"
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
        <button
          type="submit"
          class="signIn"
          disabled={!getLoginPageInputsEnabled()}
        >
          <i class="fas fa-sign-in-alt"></i>
          sign in
        </button>
      </form>
      <button
        type="button"
        class="text text-xs"
        style={{ "justify-content": "right" }}
        onClick={() => ForgotPasswordModal.show()}
        disabled={!getLoginPageInputsEnabled()}
      >
        forgot password?
      </button>
    </div>
  );
}
