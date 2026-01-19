import { JSXElement } from "solid-js";
import { TailwindMediaQueryDebugger } from "../../utils/TailwindMediaQueryDebugger";
import { LoaderBar } from "./LoaderBar";
import { FpsCounter } from "./FpsCounter";
import { Banners } from "./Banners";

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
