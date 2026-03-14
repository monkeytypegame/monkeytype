import { type JSXElement, lazy, Suspense } from "solid-js";

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
  DevComponents = () => (
    <Suspense>
      <LazyQueryDevtools />
      <LazyDevOptionsModal />
    </Suspense>
  );
}

export function DevTools(): JSXElement {
  return DevComponents?.() ?? null;
}
