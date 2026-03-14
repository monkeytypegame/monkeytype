import { type Component, type JSXElement, lazy, Show } from "solid-js";

let SolidQueryDevtools: Component | undefined;

if (import.meta.env.DEV) {
  SolidQueryDevtools = lazy(async () => {
    const m = await import("@tanstack/solid-query-devtools");
    return { default: m.SolidQueryDevtools };
  });
}

export function DevTools(): JSXElement {
  return (
    <Show when={SolidQueryDevtools}>
      {(Devtools) => {
        const C = Devtools();
        return <C />;
      }}
    </Show>
  );
}
