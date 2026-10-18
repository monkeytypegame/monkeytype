import { ErrorComponentProps, useRouter } from "@tanstack/solid-router";
import { JSXElement } from "solid-js";

import { LoadingPage } from "./LoadingPage";

/**
 * The loading page showing why the route failed to load, with a Retry button
 * re-running its loads (the router's error component, see
 * router/create-router.ts).
 */
export function LoadingErrorPage(props: ErrorComponentProps): JSXElement {
  const router = useRouter();
  const message = (): string =>
    props.error instanceof Error ? props.error.message : String(props.error);

  return (
    <LoadingPage
      error={{
        message: message(),
        onRetry: () => void router.invalidate(),
      }}
    />
  );
}
