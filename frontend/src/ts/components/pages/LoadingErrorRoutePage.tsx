import { ErrorComponentProps, useRouter } from "@tanstack/solid-router";
import { JSXElement } from "solid-js";

import { LoadingPage, loadingPageClass } from "./LoadingPage";
import { Page } from "./Page";

/**
 * The router's error component: the loading page showing why the route
 * failed to load, with a Retry button re-running its loads.
 */
export function LoadingErrorRoutePage(props: ErrorComponentProps): JSXElement {
  const router = useRouter();
  const message = (): string =>
    props.error instanceof Error ? props.error.message : String(props.error);

  return (
    <Page
      name="loading"
      class={loadingPageClass}
      content={() => (
        <LoadingPage
          error={{
            message: message(),
            onRetry: () => void router.invalidate(),
          }}
        />
      )}
    />
  );
}
