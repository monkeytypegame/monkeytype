import { JSXElement } from "solid-js";

import { Fa } from "./Fa";
export function LoadingCircle(): JSXElement {
  return (
    <div class="preloader p-4 text-center text-2xl text-main">
      <Fa icon="fa-circle-notch" fixedWidth spin />
    </div>
  );
}
