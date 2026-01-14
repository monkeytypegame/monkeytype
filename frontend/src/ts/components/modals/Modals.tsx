import { JSXElement } from "solid-js";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { ContactModal } from "./ContactModal";
import { SupportModal } from "./SupportModal";

export function Modals(): JSXElement {
  return (
    <>
      <VersionHistoryModal />
      <ContactModal />
      <SupportModal />
    </>
  );
}
