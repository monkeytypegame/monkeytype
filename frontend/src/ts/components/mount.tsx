import { render } from "solid-js/web";
import { qsa } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";
import { VersionButton } from "./VersionButton";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { JSXElement } from "solid-js";

const components = [VersionButton, ScrollToTop, VersionHistoryModal];

function mountToMountpoint(name: string, component: () => JSXElement): void {
  for (const mountPoint of qsa(name)) {
    render(() => component(), mountPoint.native);
    mountPoint.native.replaceWith(...mountPoint.native.children);
  }
}

export function mountComponents(): void {
  for (const component of components) {
    const name = component.name.replace("[solid-refresh]", "");
    mountToMountpoint(name, component);
  }
}
