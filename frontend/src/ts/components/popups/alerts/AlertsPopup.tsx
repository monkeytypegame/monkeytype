import { JSXElement } from "solid-js";

import { flushStrategy } from "../../../collections/inbox";
import { hideModalAndClearChain } from "../../../states/modals";
import { AnimatedModal } from "../../common/AnimatedModal";
import { Button } from "../../common/Button";
import { Inbox } from "./Inbox";
import { NotificationHistory } from "./NotificationHistory";
import { Psas } from "./Psas";

export function AlertsPopup(): JSXElement {
  return (
    <AnimatedModal
      id="Alerts"
      wrapperClass="justify-end overflow-x-hidden p-0"
      modalClass="h-full absolute right-0 top-0 max-w-[calc(100vw-5rem)] sm:max-w-[calc(350px+2rem)] rounded-l bg-bg sm:p-4 p-4 sm:pt-8 pt-8 block overflow-hidden"
      customAnimations={{
        show: {
          modal: {
            marginRight: ["-10rem", "0"],
          },
        },
        hide: {
          modal: {
            marginRight: ["0", "-10rem"],
          },
        },
      }}
      onEscape={() => hideModalAndClearChain("Alerts")}
      onBackdropClick={() => hideModalAndClearChain("Alerts")}
      afterHide={() => {
        setTimeout(() => {
          flushStrategy.flush();
        }, 125);
      }}
    >
      <MobileClose />
      <div class="grid h-full content-baseline gap-8 overflow-y-scroll px-4 text-xs">
        <Inbox />
        <Separator />
        <Psas />
        <Separator />
        <NotificationHistory />
      </div>
    </AnimatedModal>
  );
}

function MobileClose(): JSXElement {
  return (
    <Button
      class="mb-8 hidden w-full pointer-coarse:flex"
      onClick={() => hideModalAndClearChain("Alerts")}
      text="Close"
      fa={{ icon: "fa-times" }}
    />
  );
}

function Separator(): JSXElement {
  return <div class="h-1 rounded bg-sub-alt"></div>;
}
