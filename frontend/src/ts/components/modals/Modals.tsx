import { JSXElement } from "solid-js";

import { ContactModal } from "./ContactModal";
import { CustomGeneratorModal } from "./CustomGeneratorModal";
import { CustomTextModal } from "./CustomTextModal";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { SaveCustomTextModal } from "./SaveCustomTextModal";
import { SavedTextsModal } from "./SavedTextsModal";
import { SimpleModal } from "./SimpleModal";
import { SupportModal } from "./SupportModal";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { WordFilterModal } from "./WordFilterModal";

export function Modals(): JSXElement {
  return (
    <>
      <VersionHistoryModal />
      <ContactModal />
      <RegisterCaptchaModal />
      <SupportModal />
      <SimpleModal />
      <CustomTextModal />
      <SaveCustomTextModal />
      <SavedTextsModal />
      <WordFilterModal />
      <CustomGeneratorModal />
    </>
  );
}
