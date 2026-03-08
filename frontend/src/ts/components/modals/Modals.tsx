import { JSXElement, Show, Suspense, lazy } from "solid-js";

import { isDevEnvironment } from "../../utils/misc";
import { ContactModal } from "./ContactModal";
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
      <Show when={isDevEnvironment()}>
        <Suspense fallback={null}>
          <DevOptionsModal />
        </Suspense>
      </Show>
    </>
  );
}
