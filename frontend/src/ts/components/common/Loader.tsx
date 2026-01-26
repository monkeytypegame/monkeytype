import { JSXElement } from "solid-js";

import { Fa } from "./Fa";
export function LoadingCircle(): JSXElement {
  return (
    <div class="preloader text-main p-4 text-center text-2xl">
      <Fa icon="fa-circle-notch" fixedWidth spin />
    </div>
  );
}
