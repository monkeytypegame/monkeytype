import { JSXElement } from "solid-js";

import { TailwindMediaQueryDebugger } from "../../utils/TailwindMediaQueryDebugger";

import { Banners } from "./Banners";
import { FpsCounter } from "./FpsCounter";
import { LoaderBar } from "./LoaderBar";

export function Overlays(): JSXElement {
  return (
    <>
      <Banners />
      <TailwindMediaQueryDebugger />
      <LoaderBar />
      <FpsCounter />
    </>
  );
}
