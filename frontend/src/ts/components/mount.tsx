import { QueryClientProvider } from "@tanstack/solid-query";
import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { queryClient } from "../collections/client";
import { qsa } from "../utils/dom";

import { Theme } from "./core/Theme";
import { Footer } from "./layout/footer/Footer";
import { Overlays } from "./layout/overlays/Overlays";
import { Modals } from "./modals/Modals";
import { AboutPage } from "./pages/AboutPage";
import { FriendsPage } from "./pages/friends/FriendsPage";

const components: Record<string, () => JSXElement> = {
  footer: () => <Footer />,
  aboutpage: () => <AboutPage />,
  friendspage: () => (
    <QueryClientProvider client={queryClient}>
      <FriendsPage />
    </QueryClientProvider>
  ),
  modals: () => <Modals />,
  overlays: () => <Overlays />,
  theme: () => <Theme />,
};

function mountToMountpoint(name: string, component: () => JSXElement): void {
  for (const mountPoint of qsa(name)) {
    render(() => component(), mountPoint.native);
  }
}

export function mountComponents(): void {
  for (const [query, component] of Object.entries(components)) {
    mountToMountpoint(`mount[data-component=${query}]`, component);
  }
}
