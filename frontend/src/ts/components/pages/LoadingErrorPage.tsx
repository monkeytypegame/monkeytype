import {
  ErrorComponentProps,
  useMatch,
  useRouter,
} from "@tanstack/solid-router";
import { JSXElement } from "solid-js";

import {
  LoadingStepError,
  type LoadingStepFallback,
} from "../../router/loading-bar";
import { LoadingPage } from "./LoadingPage";

/**
 * The loading page showing why the route failed to load, with a Retry button
 * re-running its loads and the failed step's fallback, if any (the router's
 * error component, see router/create-router.ts).
 */
export function LoadingErrorPage(props: ErrorComponentProps): JSXElement {
  const router = useRouter();
  // the failed route's page (none for a layout route, eg. user data)
  const page = useMatch({
    strict: false,
    select: (match) => match.staticData.page,
  });
  const message = (): string => {
    const text =
      props.error instanceof Error ? props.error.message : String(props.error);
    // a loading step's message says what failed to load already
    if (props.error instanceof LoadingStepError) return text;
    const name = page();
    return `Failed to load ${name === undefined ? "the page" : `the ${name} page`}: ${text}`;
  };

  const fallback = (): LoadingStepFallback | undefined =>
    props.error instanceof LoadingStepError ? props.error.fallback : undefined;

  return (
    <LoadingPage
      error={{
        message: message(),
        onRetry: () => void router.invalidate(),
        fallback: fallback(),
      }}
    />
  );
}
