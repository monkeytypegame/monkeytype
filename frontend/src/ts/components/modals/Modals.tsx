import { JSXElement } from "solid-js";

import { ContactModal } from "./ContactModal";
import { CustomTextModal } from "./CustomTextModal";
import { CustomWordAmount } from "./CustomWordAmount";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { ShareTestSettings } from "./ShareTestSettings";
import { SimpleModal } from "./SimpleModal";
import { SupportModal } from "./SupportModal";
import { TestDuration } from "./TestDuration";
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
      <TestDuration />
      <CustomWordAmount />
      <ShareTestSettings />
    </>
  );
}
