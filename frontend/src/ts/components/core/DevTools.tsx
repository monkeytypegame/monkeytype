import { attachDevtoolsOverlay } from "@solid-devtools/overlay";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
//enable solidjs-devtools
import "solid-devtools/setup";
import { JSXElement } from "solid-js";

export function DevTools(): JSXElement {
  return (
    <>
      <h2>Dev tools active</h2>
      <SolidQueryDevtools />
    </>
  );
}

attachDevtoolsOverlay({
  defaultOpen: true, // or alwaysOpen
  noPadding: true,
});
