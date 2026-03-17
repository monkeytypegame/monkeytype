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

  const _LazySolidDevtoolsOverlay = lazy(async () =>
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
      <LazyQueryDevtools />
      <LazyDevOptionsModal />
      {/*.
     <LazySolidDevtoolsOverlay />
     */}
    </Suspense>
  );
}

export function DevTools(): JSXElement {
  return DevComponents?.() ?? null;
}
