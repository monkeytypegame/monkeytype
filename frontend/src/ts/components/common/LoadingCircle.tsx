import { JSXElement } from "solid-js";

import { Fa } from "./Fa";
export function LoadingCircle(): JSXElement {
  return (
    <div class="text-main">
      <Fa icon="fa-circle-notch" fixedWidth spin />
    </div>
  );
}
