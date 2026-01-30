import { TanStackDevtools } from "@tanstack/solid-devtools";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import { JSXElement } from "solid-js";

export function DevTools(): JSXElement {
  return (
    <TanStackDevtools
      plugins={[{ name: "TanStack Query", render: <SolidQueryDevtools /> }]}
    />
  );
}
