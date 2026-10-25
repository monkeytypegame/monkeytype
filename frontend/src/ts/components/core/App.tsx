import { QueryClientProvider } from "@tanstack/solid-query";
import {
  RouterContextProvider,
  RouterProvider as RouteRenderer,
} from "@tanstack/solid-router";
import { JSXElement } from "solid-js";

import { queryClient } from "../../queries";
import { router } from "../../router/app-router";
import { getGlobalOffsetTop, isAppReady } from "../../states/core";
import { isFocusMode } from "../../states/test";
import { cn } from "../../utils/cn";
import { convertRemToPixels } from "../../utils/numbers";
import { Advertisement } from "../common/Advertisement";
import { Anime } from "../common/anime";
import { DevTools } from "../dev/DevTools";
import { FocusModeExit } from "../layout/FocusModeExit";
import { Footer } from "../layout/footer/Footer";
import { Header } from "../layout/header/Header";
import { Overlays } from "../layout/overlays/Overlays";
import { Modals } from "../modals/Modals";
import { BarTimerProgress } from "../pages/test/live-stats/BarTimerProgress";
import { CustomBackground } from "./CustomBackground";
import { Font } from "./Font";
import { Theme } from "./Theme";

export function App(): JSXElement {
  return (
    <Providers>
      <Overlays />
      <FocusModeExit />
      <CustomBackground />
      <Theme />
      <Font />
      <BarTimerProgress />
      <div id="solidmodals">
        <Modals />
      </div>
      <Anime
        id="app"
        class={cn("content-grid", { hidden: !isAppReady() })}
        data-focused={isFocusMode() ? "" : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: isAppReady() ? 1 : 0, duration: 250 }}
        style={{
          "padding-top": `${getGlobalOffsetTop() + convertRemToPixels(2)}px`,
        }}
      >
        <Header />
        <main class="full-width content-grid h-full">
          <Advertisement
            id="ad-vertical-left"
            visible={["on", "sellout"]}
            vertical
          />
          <RouteRenderer router={router} />
          <Advertisement
            id="ad-vertical-right"
            visible={["on", "sellout"]}
            vertical
          />
        </main>
        <Footer />
        <Advertisement id="ad-footer" visible={"sellout"} />
      </Anime>
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
