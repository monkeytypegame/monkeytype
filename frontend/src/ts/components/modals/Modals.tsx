import { JSXElement } from "solid-js";

import { ContactModal } from "./ContactModal";
import { CustomGeneratorModal } from "./CustomGeneratorModal";
import { CustomTextModal } from "./CustomTextModal";
import { CustomWordAmount } from "./CustomWordAmount";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { SaveCustomTextModal } from "./SaveCustomTextModal";
import { SavedTextsModal } from "./SavedTextsModal";
import { ShareTestSettings } from "./ShareTestSettings";
import { SimpleModal } from "./SimpleModal";
import { SupportModal } from "./SupportModal";
import { TestDuration } from "./TestDuration";
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
      <TestDuration />
      <CustomWordAmount />
      <ShareTestSettings />
      <CustomTextModal />
      <SaveCustomTextModal />
      <SavedTextsModal />
      <WordFilterModal />
      <CustomGeneratorModal />
    </>
  );
}
