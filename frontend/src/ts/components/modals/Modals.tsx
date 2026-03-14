import { JSXElement, lazy, Suspense } from "solid-js";

import { ContactModal } from "./ContactModal";
import { RegisterCaptchaModal } from "./RegisterCaptchaModal";
import { SupportModal } from "./SupportModal";
import { VersionHistoryModal } from "./VersionHistoryModal";

let DevModals: (() => JSXElement) | undefined;
if (import.meta.env.DEV) {
  const Lazy = lazy(async () =>
    import("./DevOptionsModal").then((m) => ({ default: m.DevOptionsModal })),
  );
  DevModals = () => (
    <Suspense>
      <Lazy />
    </Suspense>
  );
}

export function Modals(): JSXElement {
  return (
    <>
      <VersionHistoryModal />
      <ContactModal />
      <RegisterCaptchaModal />
      <SupportModal />
      {DevModals?.()}
    </>
  );
}
