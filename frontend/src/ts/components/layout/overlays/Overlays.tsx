import { JSXElement } from "solid-js";
import { TailwindMediaQueryDebugger } from "../../utils/TailwindMediaQueryDebugger";
import { LoaderBar } from "./LoaderBar";
import { FpsCounter } from "./FpsCounter";

export function Overlays(): JSXElement {
  return (
    <>
      <TailwindMediaQueryDebugger />
      <LoaderBar />
      <FpsCounter />
    </>
  );
}
