import { QueryClientProvider } from "@tanstack/solid-query";
import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { queryClient } from "../collections/client";
import { qsa } from "../utils/dom";

import { Theme } from "./core/Theme";
import { DevTools } from "./DevTools";
import { Footer } from "./layout/footer/Footer";
import { Overlays } from "./layout/overlays/Overlays";
import { Modals } from "./modals/Modals";
import { AboutPage } from "./pages/AboutPage";
import { BlockedUsers } from "./pages/account-settings/BlockedUsers";
import { FriendsPage } from "./pages/friends/FriendsPage";

const components: Record<string, () => JSXElement> = {
  footer: () => <Footer />,
  aboutpage: () => <AboutPage />,
  friendspage: () => <FriendsPage />,
  modals: () => <Modals />,
  overlays: () => <Overlays />,
  theme: () => <Theme />,
  accountblockedusers: () => <BlockedUsers />,
  devtools: () => <DevTools />,
};

function mountToMountpoint(name: string, component: () => JSXElement): void {
  for (const mountPoint of qsa(name)) {
    render(
      () => (
        <QueryClientProvider client={queryClient}>
          {component()}
        </QueryClientProvider>
      ),
      mountPoint.native,
    );
  }
}

export function mountComponents(): void {
  for (const [query, component] of Object.entries(components)) {
    mountToMountpoint(`mount[data-component=${query}]`, component);
  }
}
