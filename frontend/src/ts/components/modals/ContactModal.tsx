import { JSXElement } from "solid-js";
import { AnimatedModal } from "../common/AnimatedModal";
// import "./ContactModal.scss";
import { Button } from "../common/Button";

export function ContactModal(): JSXElement {
  const buttonClass = "md:p-8 gap-4 md:text-2xl p-4 xs:text-xl text-base";

  return (
    <AnimatedModal id="Contact" modalClass="max-w-4xl">
      <div class="title">Contact</div>
      <div class="text">
        Feel free to send an email to contact@monkeytype.com. For business
        inquiries, email jack@monkeytype.com (the buttons below will open the
        default mail client).
        <br />
        <br />
        Please <span class="text-error">do not send</span> requests to delete
        account, update email, update name or clear personal bests - you can do
        that in the settings page.
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Question] "
          fixedWidthIcon
          icon="fas fa-question-circle"
          text="Question"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Feedback] "
          fixedWidthIcon
          icon="fas fa-comment-dots"
          text="Feedback"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:support@monkeytype.com?subject=[Bug] "
          fixedWidthIcon
          icon="fas fa-bug"
          text="Bug Report"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:support@monkeytype.com?subject=[Account] "
          fixedWidthIcon
          icon="fas fa-user-circle"
          text="Account Help"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:jack@monkeytype.com?subject=[Business] "
          fixedWidthIcon
          icon="fas fa-briefcase"
          text="Business Inquiry"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Other] "
          fixedWidthIcon
          icon="fas fa-ellipsis-h"
          text="Other"
          class={buttonClass}
        />
      </div>
    </AnimatedModal>
  );
}
