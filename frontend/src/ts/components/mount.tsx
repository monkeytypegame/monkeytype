import { render } from "solid-js/web";
import { qsr } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";
import { VersionButton } from "../elements/VersionButton";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { JSXElement } from "solid-js";

const componentsWithMountpoint = [VersionButton, ScrollToTop];

const components = {
  "#popups": [<VersionHistoryModal />],
};

function mountToMountpoint(name: string, component: JSXElement): void {
  const mountPoint = qsr(`mountpoint#${name}`);
  const parent = mountPoint.getParent()?.native;

  if (parent === null || parent === undefined) {
    throw new Error(
      `Cannot mount component: mount point's parent is not in the DOM.`,
    );
  }

  render(() => component, mountPoint.native);

  const children = mountPoint.native.children;

  //replace mount point with its children
  for (let i = children.length - 1; i >= 0; i--) {
    parent.insertBefore(children[i] as Element, mountPoint.native);
  }

  mountPoint.remove();
}

export function mountComponents(): void {
  for (const component of componentsWithMountpoint) {
    const name = component.name.replace("[solid-refresh]", "");
    mountToMountpoint(name, component());
  }
  for (const [selector, componentList] of Object.entries(components)) {
    const container = qsr(selector);
    for (const component of componentList) {
      render(() => component, container.native);
    }
  }
}
