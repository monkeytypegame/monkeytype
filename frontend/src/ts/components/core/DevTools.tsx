import { hotkeysDevtoolsPlugin } from "@tanstack/solid-hotkeys-devtools";
import { JSXElement, lazy, onMount, Suspense } from "solid-js";

let DevComponents: (() => JSXElement) | undefined;

if (import.meta.env.DEV) {
  const LazyQueryDevtools = lazy(async () =>
    import("@tanstack/solid-query-devtools").then((m) => ({
      default: m.SolidQueryDevtools,
    })),
  );
  const LazyDevOptionsModal = lazy(async () =>
    import("../modals/DevOptionsModal").then((m) => ({
      default: m.DevOptionsModal,
    })),
  );
  const LazyTanstackDevtools = lazy(async () =>
    import("@tanstack/solid-devtools").then((m) => ({
      default: m.TanStackDevtools,
    })),
  );

  const LazySolidDevtoolsOverlay = lazy(async () =>
    import("@solid-devtools/overlay").then((m) => ({
      default: () => {
        onMount(() => {
          m.attachDevtoolsOverlay({
            defaultOpen: false,
            noPadding: true,
          });
        });

        return null;
      },
    })),
  );

  DevComponents = () => (
    <Suspense>
      <LazyTanstackDevtools
        plugins={[hotkeysDevtoolsPlugin()]}
        config={{ defaultOpen: false }}
      />
      <LazyQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
      <LazyDevOptionsModal />
      <LazySolidDevtoolsOverlay />
    </Suspense>
  );
}

export function DevTools(): JSXElement {
  return DevComponents?.() ?? null;
}
