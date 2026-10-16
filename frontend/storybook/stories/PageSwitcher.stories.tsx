import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  RegisteredRouter,
  RouterProvider,
} from "@tanstack/solid-router";
import { JSXElement, onCleanup } from "solid-js";

import preview from "#.storybook/preview";

import { createRouterPage } from "../../src/ts/components/core/Page";
import { PageSwitcher } from "../../src/ts/components/core/PageSwitcher";
import { LoadingRoutePage } from "../../src/ts/components/pages/LoadingPage";
import { setRouter } from "../../src/ts/router/instance";
import {
  isLoadingBarShown,
  setLoadingBarShown,
} from "../../src/ts/states/loading-page";
import { sleep } from "../../src/ts/utils/misc";

function stubPage(title: string): () => JSXElement {
  return () => (
    <div class="grid h-64 content-center justify-center rounded bg-sub-alt text-2xl text-text">
      {title}
    </div>
  );
}

function Controls(): JSXElement {
  const linkClass = "text-sub hover:text-text";
  return (
    <div class="mb-4 flex gap-4">
      <Link to="/" class={linkClass} activeProps={{ class: "text-main" }}>
        test
      </Link>
      <Link to="/about" class={linkClass} activeProps={{ class: "text-main" }}>
        about
      </Link>
      <Link
        to="/settings"
        class={linkClass}
        activeProps={{ class: "text-main" }}
      >
        settings
      </Link>
      <Link to="/slow" class={linkClass} activeProps={{ class: "text-main" }}>
        slow (2s loader)
      </Link>
      <button
        type="button"
        class={linkClass}
        onClick={() => setLoadingBarShown(!isLoadingBarShown())}
      >
        loading bar: {isLoadingBarShown() ? "on" : "off"}
      </button>
    </div>
  );
}

// oxlint-disable-next-line typescript/explicit-function-return-type -- the router type is inferred from the route tree
function createStoryRouter() {
  const rootRoute = createRootRoute({
    component: () => (
      <div style={{ padding: "16px", width: "100%" }}>
        <Controls />
        <PageSwitcher />
      </div>
    ),
  });

  const routes = [
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      staticData: { page: "test" },
      component: createRouterPage(stubPage("Test page")),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/about",
      staticData: { page: "about" },
      component: createRouterPage(stubPage("About page")),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/settings",
      staticData: { page: "settings" },
      component: createRouterPage(stubPage("Settings page")),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/slow",
      staticData: { page: "account" },
      // longer than pendingMs: shows the loading page with a spinner
      loader: async () => sleep(2000),
      component: createRouterPage(stubPage("Slow page")),
    }),
  ];

  return createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultPreload: false,
    // like the app router: the loading page with a spinner for a slow navigation
    defaultPendingComponent: LoadingRoutePage,
    defaultPendingMs: 500,
    defaultPendingMinMs: 500,
  });
}

const meta = preview.meta({
  title: "Core/PageSwitcher",
  component: PageSwitcher,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => {
    const router = createStoryRouter();
    // PageSwitcher reads pending state through the app's router handle
    setRouter(router as unknown as RegisteredRouter);
    onCleanup(() => {
      setRouter(undefined);
      setLoadingBarShown(false);
    });
    return <RouterProvider router={router} />;
  },
});
