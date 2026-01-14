import { render } from "solid-js/web";
import { qsa } from "../utils/dom";

import { JSXElement } from "solid-js";
import { Footer } from "./layout/footer/Footer";
import { Modals } from "./modals/Modals";
import { AboutPage } from "./pages/AboutPage";
import { ThemeColors } from "./layout/ThemeColors";

const components: Record<string, () => JSXElement> = {
  Footer: () => <Footer />,
  Modals: () => <Modals />,
  AboutPage: () => <AboutPage />,
  ThemeColors: () => <ThemeColors />,
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
