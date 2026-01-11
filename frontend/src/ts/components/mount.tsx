import { render } from "solid-js/web";
import { qsa } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";
import { VersionButton } from "./VersionButton";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { JSXElement } from "solid-js";
import { SupportModal } from "./SupportModal";
import { ContactModal } from "./ContactModal";
import { Footer } from "./Footer";

const components: Record<string, () => JSXElement> = {
  VersionButton: VersionButton,
  ScrollToTop: ScrollToTop,
  VersionHistoryModal: VersionHistoryModal,
  ContactModal: ContactModal,
  SupportModal: SupportModal,
  Footer: Footer,
};

function mountToMountpoint(name: string, component: () => JSXElement): void {
  for (const mountPoint of qsa(name)) {
    render(() => component(), mountPoint.native);
    mountPoint.native.replaceWith(...mountPoint.native.children);
  }
}

export function mountComponents(): void {
  for (const [query, component] of Object.entries(components)) {
    mountToMountpoint(query, component);
  }
}
