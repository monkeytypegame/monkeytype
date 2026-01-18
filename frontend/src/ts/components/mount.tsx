import { render } from "solid-js/web";
import { qsa } from "../utils/dom";
import { JSXElement } from "solid-js";
import { Footer } from "./layout/footer/Footer";
import { Modals } from "./modals/Modals";
import { AboutPage } from "./pages/AboutPage";
import { Theme } from "./layout/Theme";
import { Overlays } from "./layout/overlays/Overlays";

const components: Record<string, () => JSXElement> = {
  Footer: () => <Footer />,
  Modals: () => <Modals />,
  AboutPage: () => <AboutPage />,
  Theme: () => <Theme />,
  Overlays: () => <Overlays />,
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
