import { JSXElement } from "solid-js";
import { AnimatedModal } from "./AnimatedModal";
import "./ContactModal.scss";
import { hideCurrentModalAndClearChain } from "../stores/modals";

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
      <button type="button" onClick={() => hideCurrentModalAndClearChain()}>
        hide and clear chain
      </button>
      <div class="buttons">
        <a
          class="button"
          target="_blank"
          href="mailto:contact@monkeytype.com?subject=[Question] "
          rel="noopener"
        >
          <div class="icon">
            <i class="fas fa-question-circle"></i>
          </div>
          <div class="textGroup">
            <div class="text">Question</div>
          </div>
        </a>
        <a
          class="button"
          target="_blank"
          href="mailto:contact@monkeytype.com?subject=[Feedback] "
          rel="noopener"
        >
          <div class="icon">
            <i class="fas fa-comment-dots"></i>
          </div>
          <div class="textGroup">
            <div class="text">Feedback</div>
          </div>
        </a>
        <a
          class="button"
          target="_blank"
          href="mailto:support@monkeytype.com?subject=[Bug] "
          rel="noopener"
        >
          <div class="icon">
            <i class="fas fa-bug"></i>
          </div>
          <div class="textGroup">
            <div class="text">Bug Report</div>
          </div>
        </a>
        <a
          class="button"
          target="_blank"
          href="mailto:support@monkeytype.com?subject=[Account] "
          rel="noopener"
        >
          <div class="icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="textGroup">
            <div class="text">Account Help</div>
          </div>
        </a>
        <a
          class="button"
          target="_blank"
          href="mailto:jack@monkeytype.com?subject=[Business] "
          rel="noopener"
        >
          <div class="icon">
            <i class="fas fa-briefcase"></i>
          </div>
          <div class="textGroup">
            <div class="text">Business Inquiry</div>
          </div>
        </a>
        <a
          class="button"
          target="_blank"
          href="mailto:contact@monkeytype.com?subject=[Other] "
          rel="noopener"
        >
          <div class="icon">
            <i class="fas fa-ellipsis-h"></i>
          </div>
          <div class="textGroup">
            <div class="text">Other</div>
          </div>
        </a>
      </div>
    </AnimatedModal>
  );
}
