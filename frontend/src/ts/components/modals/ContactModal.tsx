import { JSXElement } from "solid-js";
import { AnimatedModal } from "../common/AnimatedModal";
import "./ContactModal.scss";
import { Button } from "../common/Button";

export function ContactModal(): JSXElement {
  return (
    <AnimatedModal id="Contact">
      <div class="title">Contact</div>
      <div class="text">
        Feel free to send an email to contact@monkeytype.com. For business
        inquiries, email jack@monkeytype.com (the buttons below will open the
        default mail client).
        <br />
        <br />
        Please <span>do not send</span> requests to delete account, update
        email, update name or clear personal bests - you can do that in the
        settings page.
      </div>
      <div class="buttons">
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Question] "
          fixedWidthIcon
          icon="fas fa-question-circle"
          text="Question"
        />
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Feedback] "
          fixedWidthIcon
          icon="fas fa-comment-dots"
          text="Feedback"
        />
        <Button
          type="button"
          href="mailto:support@monkeytype.com?subject=[Bug] "
          fixedWidthIcon
          icon="fas fa-bug"
          text="Bug Report"
        />
        <Button
          type="button"
          href="mailto:support@monkeytype.com?subject=[Account] "
          fixedWidthIcon
          icon="fas fa-user-circle"
          text="Account Help"
        />
        <Button
          type="button"
          href="mailto:jack@monkeytype.com?subject=[Business] "
          fixedWidthIcon
          icon="fas fa-briefcase"
          text="Business Inquiry"
        />
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Other] "
          fixedWidthIcon
          icon="fas fa-ellipsis-h"
          text="Other"
        />
      </div>
    </AnimatedModal>
  );
}
