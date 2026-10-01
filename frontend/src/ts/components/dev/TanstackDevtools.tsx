import { TanStackDevtools as TsDevTools } from "@tanstack/solid-devtools";
import { hotkeysDevtoolsPlugin } from "@tanstack/solid-hotkeys-devtools";
import { SolidQueryDevtoolsPanel } from "@tanstack/solid-query-devtools";
import { JSXElement } from "solid-js";

import { queryClient } from "../../queries";
import { SignalsDevtoolsPlugin } from "./SignalsDevtools";

export function TanStackDevtools(): JSXElement {
  return (
    <TsDevTools
      plugins={[
        {
          id: "tanstack-query",
          name: "TanStack Query",
          render: () => <SolidQueryDevtoolsPanel client={queryClient} />,
          defaultOpen: true,
        },
        hotkeysDevtoolsPlugin(),
        SignalsDevtoolsPlugin(),
      ]}
      config={{ defaultOpen: false }}
    />
  );
}
