import { QueryClientProvider } from "@tanstack/solid-query";
import {
  RouterContextProvider,
  RouterProvider as RouteRenderer,
} from "@tanstack/solid-router";
import { JSXElement } from "solid-js";

import { queryClient } from "../../queries";
import { router } from "../../router/app-router";
import { getGlobalOffsetTop } from "../../states/core";
import { convertRemToPixels } from "../../utils/numbers";
import { Fa } from "../common/Fa";
import { DevTools } from "../dev/DevTools";
import { Footer } from "../layout/footer/Footer";
import { Header } from "../layout/header/Header";
import { Overlays } from "../layout/overlays/Overlays";
import { Modals } from "../modals/Modals";
import { BarTimerProgress } from "../pages/test/live-stats/BarTimerProgress";
import { Theme } from "./Theme";

export function App(): JSXElement {
  return (
    <Providers>
      <Overlays />
      <div class="customBackground"></div>
      <Theme />
      <BarTimerProgress />
      <div id="solidmodals">
        <Modals />
      </div>
      <div
        id="app"
        class="content-grid focus hidden"
        style={{
          "padding-top": `${getGlobalOffsetTop() + convertRemToPixels(2)}px`,
        }}
      >
        <Header />
        <main class="full-width content-grid h-full">
          <div
            id="ad-vertical-left-wrapper"
            class="ad advertisement ad-v focus"
          >
            <div class="icon">
              <Fa icon="fa-ad" />
            </div>
            <div id="ad-vertical-left"></div>
          </div>
          <div
            id="ad-vertical-right-wrapper"
            class="ad advertisement ad-v focus"
          >
            <div class="icon">
              <Fa icon="fa-ad" />
            </div>
            <div id="ad-vertical-right"></div>
          </div>
          {/* renders the current route's page (see PageSwitcher) */}
          <RouteRenderer router={router} />
        </main>
        <Footer />
        <div
          id="ad-footer-wrapper"
          class="full-width ad advertisement ad-h focus"
        >
          <div class="icon">
            <Fa icon="fa-ad" />
          </div>
          <div id="ad-footer"></div>
        </div>
        <div id="ad-footer-small-wrapper" class="ad advertisement ad-h-s focus">
          <div class="icon small">
            <Fa icon="fa-ad" />
          </div>
          <div id="ad-footer-small"></div>
        </div>
      </div>
      <DevTools />
    </Providers>
  );
}

/** App-wide context providers. */
function Providers(props: { children: JSXElement }): JSXElement {
  return (
    <QueryClientProvider client={queryClient}>
      {/* lets <Link> etc. work outside the RouterProvider */}
      <RouterContextProvider router={router}>
        {/* a function: the provider calls it inside its context (plain
        children would be created before, when it reads its props) */}
        {() => props.children}
      </RouterContextProvider>
    </QueryClientProvider>
  );
}
