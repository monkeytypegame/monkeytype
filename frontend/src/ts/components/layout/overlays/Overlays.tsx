import { JSXElement, Show } from "solid-js";
import { envConfig } from "virtual:env-config";

import { getIsScreenshotting } from "../../../signals/core";
import { showModal } from "../../../stores/modals";
import { cn } from "../../../utils/cn";
import { isDevEnvironment } from "../../../utils/misc";
import { Fa } from "../../common/Fa";
import { ScrollToTop } from "../footer/ScrollToTop";
import { Banners } from "./Banners";
import { FpsCounter } from "./FpsCounter";
import { LoaderBar } from "./LoaderBar";
import { MediaQueryDebugger } from "./MediaQueryDebugger";

export function Overlays(): JSXElement {
  return (
    <>
      <ScrollToTop />
      <button
        type="button"
        id="commandLineMobileButton"
        class={cn(
          "fixed bottom-8 left-8 z-99 hidden h-12 w-12 rounded-full bg-main text-center leading-12 text-bg",
          {
            "opacity-0": getIsScreenshotting(),
          },
        )}
        onClick={() => {
          showModal("Commandline");
        }}
        tabIndex="-1"
      >
        <Fa icon="fa-terminal" />
      </button>
      <Banners />
      <MediaQueryDebugger />
      <LoaderBar />
      <FpsCounter />
      <Show when={isDevEnvironment()}>
        <div id="devButtons">
          <a
            class="button configureAPI"
            href={`${envConfig.backendUrl}/configure/`}
            target="_blank"
            aria-label="Configure API"
            data-balloon-pos="right"
          >
            <i class="fas fa-fw fa-server"></i>
          </a>
          <button
            type="button"
            class="button"
            aria-label="Dev options"
            data-balloon-pos="right"
            onClick={() => showModal("DevOptions")}
          >
            <i class="fas fa-fw fa-flask"></i>
          </button>
        </div>
      </Show>
    </>
  );
}
