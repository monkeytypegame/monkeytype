import { JSXElement } from "solid-js";

import { hideModalAndClearChain, showModal } from "../../../stores/modals";
import { qs } from "../../../utils/dom";
import { AnimatedModal } from "../../common/AnimatedModal";
import { Button } from "../../common/Button";
import { Inbox } from "./Inbox";
import { NotificationHistory } from "./NotificationHistory";
import { Psas } from "./Psas";

export function AlertsPopup(): JSXElement {
  return (
    <AnimatedModal
      id="Alerts"
      wrapperClass="p-0 "
      modalClass="h-full absolute right-0 top-0 rounded flex flex-col overflow-hidden text-xs"
    >
      <MobileClose />
      <div class="flex h-full flex-col gap-4 overflow-y-scroll">
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
      onClick={() => hideModalAndClearChain("Alerts")}
      text="close"
      fa={{ icon: "fa-times" }}
    />
  );
}

function Separator(): JSXElement {
  return <div class="h-1 rounded bg-sub-alt"></div>;
}

qs("header nav .showAlerts2")?.on("click", () => {
  showModal("Alerts");
});
