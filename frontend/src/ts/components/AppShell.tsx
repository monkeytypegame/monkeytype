import { RouterProvider } from "@tanstack/solid-router";
import { JSXElement } from "solid-js";

import type { AppRouter } from "../router/create-router";

/** The router, rendering the page of the current route (see RootLayout). */
export function AppShell(props: { router: AppRouter }): JSXElement {
  return <RouterProvider router={props.router} />;
}
