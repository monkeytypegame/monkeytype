import { JSXElement } from "solid-js";

import { ContactModal } from "./ContactModal";
import { SupportModal } from "./SupportModal";
import { VersionHistoryModal } from "./VersionHistoryModal";

export function Modals(): JSXElement {
  return (
    <>
      <VersionHistoryModal />
      <ContactModal />
      <SupportModal />
    </>
  );
}
