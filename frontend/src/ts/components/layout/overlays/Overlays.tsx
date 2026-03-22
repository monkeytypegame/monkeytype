import { JSXElement, Show } from "solid-js";
import { envConfig } from "virtual:env-config";

import { getIsScreenshotting } from "../../../states/core";
import { showModal } from "../../../states/modals";
import { cn } from "../../../utils/cn";
import { isDevEnvironment } from "../../../utils/env";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { ScrollToTop } from "../footer/ScrollToTop";
import { Banners } from "./Banners";
import { FpsCounter } from "./FpsCounter";
import { LoaderBar } from "./LoaderBar";
import { MediaQueryDebugger } from "./MediaQueryDebugger";
import { Notifications } from "./Notifications";

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
      <Notifications />
      <MediaQueryDebugger />
      <LoaderBar />
      <FpsCounter />
      <Show when={isDevEnvironment()}>
        <DevButtons />
      </Show>
    </>
  );
}

function DevButtons(): JSXElement {
  return (
    <div class="fixed top-30 left-0 z-10000 flex w-max flex-col gap-2 text-xs">
      <Button
        href={`${envConfig.backendUrl}/configure/`}
        balloon={{
          text: "Configure server",
          position: "right",
        }}
        fa={{
          icon: "fa-server",
        }}
        class="rounded-tl-none rounded-bl-none p-2"
      />
      <Button
        balloon={{
          text: "Dev options",
          position: "right",
        }}
        onClick={() => showModal("DevOptions")}
        fa={{
          icon: "fa-flask",
        }}
        class="rounded-tl-none rounded-bl-none p-2"
      />
    </div>
  );
}
