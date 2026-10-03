import { QueryClientProvider } from "@tanstack/solid-query";
import { RouterProvider } from "@tanstack/solid-router";
import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { queryClient } from "../queries";
import { router } from "../router";
import { qsa } from "../utils/dom";
import { Theme } from "./core/Theme";
import { DevTools } from "./dev/DevTools";
import { CommandlineHotkey } from "./hotkeys/CommandlineHotkey";
import { Footer } from "./layout/footer/Footer";
import { Header } from "./layout/header/Header";
import { Overlays } from "./layout/overlays/Overlays";
import { Modals } from "./modals/Modals";
import { MyProfile } from "./pages/account/MyProfile";
import { Pages } from "./pages/Pages";
import { BarTimerProgress } from "./pages/test/live-stats/BarTimerProgress";
import { Popups } from "./popups/Popups";

const components: Record<string, () => JSXElement> = {
  // first - other components and vanilla modules depend on page DOM
  pages: () => (
    // pages render outside the router's matches so they don't wait on route loads
    <RouterProvider
      router={router}
      InnerWrap={(props) => (
        <>
          <Pages />
          {props.children}
        </>
      )}
    />
  ),
  footer: () => <Footer />,
  myprofile: () => <MyProfile />,
  modals: () => <Modals />,
  popups: () => <Popups />,
  overlays: () => <Overlays />,
  theme: () => <Theme />,
  header: () => <Header />,
  devtools: () => <DevTools />,
  commandlinehotkey: () => <CommandlineHotkey />,
  bartimerprogress: () => <BarTimerProgress />,
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
    mountToMountpoint(`[data-component=${query}]`, component);
  }
}
