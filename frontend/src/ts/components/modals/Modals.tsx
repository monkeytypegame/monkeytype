import { JSXElement } from "solid-js";

import { ViewApeKeyModal } from "./account-settings/ViewApeKeyModal";
import { CommandlineModal } from "./CommandlineModal";
import { ContactModal } from "./ContactModal";
import { CookiesModal } from "./CookiesModal";
import { CustomTestDurationModal } from "./CustomTestDurationModal";
import { CustomTextModal } from "./CustomTextModal";
import { CustomWordAmountModal } from "./CustomWordAmountModal";
import { EditResultTagsModal } from "./EditResultTagsModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { GoogleSignupModal } from "./GoogleSignUpModal";
import { LastSignedOutResultModal } from "./LastSignedOutResultModal";
import { MobileTestConfigModal } from "./MobileTestConfigModal";
import { PbTablesModal } from "./PbTablesModal";
import { PractiseWordsModal } from "./PractiseWordsModal";
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
import { TheRestModal } from "./TheRestModal";
import { UserReportModal } from "./UserReportModal";
import { VersionHistoryModal } from "./VersionHistoryModal";

export function Modals(): JSXElement {
  return (
    <>
      <CommandlineModal />
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
      <PbTablesModal />
      <PractiseWordsModal />
      <ShareTestSettings />
      <MobileTestConfigModal />
      <CookiesModal />
      <AddPresetModal />
      <EditPresetModal />
      <ViewApeKeyModal />
      <LastSignedOutResultModal />
      <StreakHourOffsetModal />
      <GoogleSignupModal />
      <ForgotPasswordModal />
      <UserReportModal />
      <EditResultTagsModal />
      <TheRestModal />
    </>
  );
}
