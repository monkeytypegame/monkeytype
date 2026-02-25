import { QueryClientProvider } from "@tanstack/solid-query";
import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { queryClient } from "../queries";
import { qsa } from "../utils/dom";
import { DevTools } from "./core/DevTools";
import { Theme } from "./core/Theme";
import { Footer } from "./layout/footer/Footer";
import { Overlays } from "./layout/overlays/Overlays";
import { Modals } from "./modals/Modals";
import { AboutPage } from "./pages/AboutPage";
import { MyProfile } from "./pages/account/MyProfile";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { ProfileSearchPage } from "./pages/profile/ProfileSearchPage";

const components: Record<string, () => JSXElement> = {
  footer: () => <Footer />,
  aboutpage: () => <AboutPage />,
  profilepage: () => <ProfilePage />,
  profilesearchpage: () => <ProfileSearchPage />,
  myprofile: () => <MyProfile />,
  modals: () => <Modals />,
  overlays: () => <Overlays />,
  theme: () => <Theme />,
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
