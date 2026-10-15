import { JSXElement } from "solid-js";

import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

export function ContactModal(): JSXElement {
  const buttonClass = " gap-4 text-md p-4 text-lg justify-start";

  return (
    <AnimatedModal id="Contact" modalClass="max-w-4xl" title="Contact">
      <div>
        Feel free to send an email to recurse@kmit.in (the buttons below will
        open the default mail client).
        <br />
        <br />
        Please <span class="text-error">do not send</span> requests to delete
        account, update email, update name or clear personal bests - you can do
        that in the <a href="/account-settings">account settings</a> page.
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <Button
          variant="button"
          href="mailto:recurse@kmit.in?subject=[Question] "
          text="Question"
          class={buttonClass}
          fa={{
            icon: "fa-question-circle",
            fixedWidth: true,
          }}
        />
        <Button
          variant="button"
          href="mailto:recurse@kmit.in?subject=[Feedback] "
          fa={{
            icon: "fa-comment-dots",
            fixedWidth: true,
          }}
          text="Feedback"
          class={buttonClass}
        />
        <Button
          variant="button"
          href="mailto:recurse@kmit.in?subject=[Bug] "
          fa={{
            icon: "fa-bug",
            fixedWidth: true,
          }}
          text="Bug Report"
          class={buttonClass}
        />
        <Button
          variant="button"
          href="mailto:recurse@kmit.in?subject=[Account] "
          fa={{
            icon: "fa-user-circle",
            fixedWidth: true,
          }}
          text="Account Help"
          class={buttonClass}
        />
        <Button
          variant="button"
          href="mailto:recurse@kmit.in?subject=[Business] "
          fa={{
            icon: "fa-briefcase",
            fixedWidth: true,
          }}
          text="Business Inquiry"
          class={buttonClass}
        />
        <Button
          variant="button"
          href="mailto:recurse@kmit.in?subject=[Other] "
          fa={{
            icon: "fa-ellipsis-h",
            fixedWidth: true,
          }}
          text="Other"
          class={buttonClass}
        />
      </div>
    </AnimatedModal>
  );
}
