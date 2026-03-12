import { JSXElement, Show, Suspense, lazy } from "solid-js";

import { isDevEnvironment } from "../../utils/misc";
import { ContactModal } from "./ContactModal";
import { FaqModal } from "./FaqModal";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { SupportModal } from "./SupportModal";
import { VersionHistoryModal } from "./VersionHistoryModal";

const DevOptionsModal = lazy(async () =>
  import("./DevOptionsModal").then((m) => ({ default: m.DevOptionsModal })),
);

export function Modals(): JSXElement {
  return (
    <>
      <VersionHistoryModal />
      <ContactModal />
      <RegisterCaptchaModal />
      <SupportModal />
      <FaqModal />
      <Show when={isDevEnvironment()}>
        <Suspense fallback={null}>
          <DevOptionsModal />
        </Suspense>
      </Show>
    </>
  );
}
