import {
  faQuestionCircle,
  faCommentDots,
  faBug,
  faUserCircle,
  faBriefcase,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import { JSXElement } from "solid-js";

import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

export function ContactModal(): JSXElement {
  const buttonClass = " gap-4 text-md p-4 text-lg justify-start";

  return (
    <AnimatedModal id="Contact" modalClass="max-w-4xl" title="Contact">
      <div>
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
          text="Question"
          class={buttonClass}
          fa={{
            icon: faQuestionCircle,
            fixedWidth: true,
          }}
        />
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Feedback] "
          fa={{
            icon: faCommentDots,
            fixedWidth: true,
          }}
          text="Feedback"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:support@monkeytype.com?subject=[Bug] "
          fa={{
            icon: faBug,
            fixedWidth: true,
          }}
          text="Bug Report"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:support@monkeytype.com?subject=[Account] "
          fa={{
            icon: faUserCircle,
            fixedWidth: true,
          }}
          text="Account Help"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:jack@monkeytype.com?subject=[Business] "
          fa={{
            icon: faBriefcase,
            fixedWidth: true,
          }}
          text="Business Inquiry"
          class={buttonClass}
        />
        <Button
          type="button"
          href="mailto:contact@monkeytype.com?subject=[Other] "
          fa={{
            icon: faEllipsisH,
            fixedWidth: true,
          }}
          text="Other"
          class={buttonClass}
        />
      </div>
    </AnimatedModal>
  );
}
