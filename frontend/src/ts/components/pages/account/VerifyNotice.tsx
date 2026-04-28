import { createSignal, JSXElement, Show } from "solid-js";

import { sendVerificationEmail } from "../../../auth";
import { isUserVerified } from "../../../states/core";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";

export function VerifyNotice(props: { class: string }): JSXElement {
  const [isProcessing, setProcessing] = createSignal(false);

  const resendVerificationEmail = () => {
    setProcessing(true);
    void sendVerificationEmail().finally(() => setProcessing(false));
  };
  return (
    <Show when={!isUserVerified()}>
      <div
        class={cn(
          `grid items-center gap-4 rounded p-4 ring-4 ring-sub-alt md:grid-cols-[1fr_auto] ${props.class}`,
        )}
      >
        <div class="grid grid-cols-[auto_1fr] items-center gap-4">
          <Fa icon="fa-exclamation-triangle" class="text-4xl text-sub" />
          <div>Your email address is still not verified</div>
        </div>
        <Button
          class="px-4"
          text="resend verification email"
          disabled={isProcessing()}
          onClick={resendVerificationEmail}
        />
      </div>
    </Show>
  );
}
