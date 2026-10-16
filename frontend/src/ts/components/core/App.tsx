import { QueryClientProvider } from "@tanstack/solid-query";
import { JSXElement } from "solid-js";

import { queryClient } from "../../queries";
import { getGlobalOffsetTop } from "../../states/core";
import { convertRemToPixels } from "../../utils/numbers";
import { Fa } from "../common/Fa";
import { DevTools } from "../dev/DevTools";
import { Footer } from "../layout/footer/Footer";
import { Header } from "../layout/header/Header";
import { Overlays } from "../layout/overlays/Overlays";
import { Modals } from "../modals/Modals";
import { pageRegistry } from "../pages/page-registry";
import { Pages } from "../pages/Pages";
import { BarTimerProgress } from "../pages/test/live-stats/BarTimerProgress";
import { Theme } from "./Theme";

export function App(): JSXElement {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Pages registry={pageRegistry} />
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
    </QueryClientProvider>
  );
}
