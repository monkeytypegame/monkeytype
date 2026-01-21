import { JSXElement } from "solid-js";

import { Banners } from "./Banners";
import { FpsCounter } from "./FpsCounter";
import { LoaderBar } from "./LoaderBar";
import { MediaQueryDebugger } from "./MediaQueryDebugger";

export function Overlays(): JSXElement {
  return (
    <>
      <Banners />
      <MediaQueryDebugger />
      <LoaderBar />
      <FpsCounter />
    </>
  );
}
