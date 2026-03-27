import { JSXElement } from "solid-js";

import { ContactModal } from "./ContactModal";
import { CustomTestDurationModal } from "./CustomTestDurationModal";
import { CustomTextModal } from "./CustomTextModal";
import { CustomWordAmountModal } from "./CustomWordAmountModal";
import { MobileTestConfigModal } from "./MobileTestConfigModal";
import { QuoteRateModal } from "./QuoteRateModal";
import { QuoteReportModal } from "./QuoteReportModal";
import { QuoteSearchModal } from "./QuoteSearchModal";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { ShareTestSettings } from "./ShareTestSettings";
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
      <QuoteRateModal />
      <QuoteReportModal />
      <QuoteSearchModal />
      <CustomTestDurationModal />
      <CustomWordAmountModal />
      <ShareTestSettings />
      <MobileTestConfigModal />
    </>
  );
}
