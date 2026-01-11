import { render } from "solid-js/web";
import { qsa } from "../utils/dom";
import { ScrollToTop } from "./ScrollToTop";
import { JSXElement } from "solid-js";
import { Footer } from "./Footer";
import { Modals } from "./Modals";

const components: Record<string, () => JSXElement> = {
  ScrollToTop: ScrollToTop,
  Modals: Modals,
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
