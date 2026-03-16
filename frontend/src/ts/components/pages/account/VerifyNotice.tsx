import { createSignal, JSXElement, Show } from "solid-js";

import { sendVerificationEmail } from "../../../auth";
import { isUserVerified } from "../../../signals/core";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";

export function VerifyNotice(): JSXElement {
  const [isProcessing, setProcessing] = createSignal(false);

  const resendVerificationEmail = () => {
    setProcessing(true);
    void sendVerificationEmail().finally(() => setProcessing(false));
  };
  return (
    <Show when={!isUserVerified()}>
      <div class="mb-8 flex flex-row items-center gap-6 rounded p-4 ring-4 ring-sub-alt">
        <Fa icon="fa-exclamation-triangle" class="text-4xl text-sub" />
        <div>Your email address is still not verified</div>
        <Button
          text="resend verification email"
          class="flex-none"
          disabled={isProcessing()}
          onClick={resendVerificationEmail}
        />
      </div>
    </Show>
  );
}
