import { RouterProvider } from "@tanstack/solid-router";
import { JSXElement } from "solid-js";

import type { AppRouter } from "../router/create-router";

import { Pages } from "./pages/Pages";

/** The router and the pages it selects. */
export function AppShell(props: { router: AppRouter }): JSXElement {
  return (
    // pages render outside the router's matches so they don't wait on route loads
    <RouterProvider
      router={props.router}
      InnerWrap={(innerProps) => (
        <>
          <Pages />
          {innerProps.children}
        </>
      )}
    />
  );
}
