import { JSXElement } from "solid-js";

import { TailwindMediaQueryDebugger } from "../../utils/TailwindMediaQueryDebugger";

import { FpsCounter } from "./FpsCounter";
import { LoaderBar } from "./LoaderBar";

export function Overlays(): JSXElement {
  return (
    <>
      <TailwindMediaQueryDebugger />
      <LoaderBar />
      <FpsCounter />
    </>
  );
}
