import { render } from "solid-js/web";
import { qsa } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";
import { VersionButton } from "../elements/VersionButton";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { JSXElement } from "solid-js";
import { Footer } from "./Footer";
import { ContactModal } from "./ContactModal";
import { SupportModal } from "./SupportModal";

const components = [
  VersionButton,
  ScrollToTop,
  VersionHistoryModal,
  ContactModal,
  SupportModal,
  Footer,
];

function mountToMountpoint(name: string, component: () => JSXElement): void {
  qsa(name).forEach((mountPoint) => {
    render(() => component(), mountPoint.native);
    mountPoint.native.replaceWith(...mountPoint.native.children);
  });
}

export function mountComponents(): void {
  for (const component of components) {
    const name = component.name.replace("[solid-refresh]", "");
    mountToMountpoint(name, component);
  }
}
