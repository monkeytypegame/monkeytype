import { JSXElement } from "solid-js";

import { ViewApeKeyModal } from "./account-settings/ViewApeKeyModal";
import { ContactModal } from "./ContactModal";
import { CookiesModal } from "./CookiesModal";
import { CustomTestDurationModal } from "./CustomTestDurationModal";
import { CustomTextModal } from "./CustomTextModal";
import { CustomWordAmountModal } from "./CustomWordAmountModal";
import { FingerTrainingModal } from "./FingerTrainingModal";
import { LastSignedOutResultModal } from "./LastSignedOutResultModal";
import { MobileTestConfigModal } from "./MobileTestConfigModal";
import { AddPresetModal } from "./preset/AddPresetModal";
import { EditPresetModal } from "./preset/EditPresetModal";
import { QuoteRateModal } from "./QuoteRateModal";
import { QuoteReportModal } from "./QuoteReportModal";
import { QuoteSearchModal } from "./QuoteSearchModal";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { ShareTestSettings } from "./ShareTestSettings";
import { SimpleModal } from "./SimpleModal";
import { StreakHourOffsetModal } from "./StreakHourOffsetModal";
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
      <CookiesModal />
      <AddPresetModal />
      <EditPresetModal />
      <ViewApeKeyModal />
      <LastSignedOutResultModal />
      <StreakHourOffsetModal />
      <FingerTrainingModal />
    </>
  );
}
