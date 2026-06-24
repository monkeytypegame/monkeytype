import { JSXElement, lazy, onMount, Suspense } from "solid-js";

let DevComponents: (() => JSXElement) | undefined;

if (import.meta.env.DEV) {
  const LazyTanstackDevtools = lazy(async () =>
    import("./TanstackDevtools").then((m) => ({
      default: m.TanStackDevtools,
    })),
  );
  const LazyDevOptionsModal = lazy(async () =>
    import("../modals/DevOptionsModal").then((m) => ({
      default: m.DevOptionsModal,
    })),
  );
  const LazyEventLogViewerModal = lazy(async () =>
    import("../modals/EventLogViewerModal").then((m) => ({
      default: m.EventLogViewerModal,
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
      <LazyTanstackDevtools />
      <LazyDevOptionsModal />
      <LazyEventLogViewerModal />
      <LazySolidDevtoolsOverlay />
    </Suspense>
  );
}

export function DevTools(): JSXElement {
  return DevComponents?.() ?? null;
}
