import { JSXElement } from "solid-js";

import { ContactModal } from "./ContactModal";
import { CustomTextModal } from "./CustomTextModal";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { SimpleModal } from "./SimpleModal";
import { SupportModal } from "./SupportModal";
import { VersionHistoryModal } from "./VersionHistoryModal";

export function Modals(): JSXElement {
  return (
    <>
      <VersionHistoryModal />
      <ContactModal />
      <RegisterCaptchaModal />
      <SupportModal />
      <SimpleModal />
      <CustomTextModal />
    </>
  );
}
