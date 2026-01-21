import { JSXElement } from "solid-js";

import { showModal } from "../../../stores/modals";
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
        class="bg-main text-bg fixed bottom-8 left-8 z-99 hidden h-12 w-12 rounded-full text-center leading-12"
        onClick={() => {
          showModal("Commandline");
        }}
        tabIndex="-1"
      >
        <i class="fas fa-terminal"></i>
      </button>
      <Banners />
      <MediaQueryDebugger />
      <LoaderBar />
      <FpsCounter />
    </>
  );
}
