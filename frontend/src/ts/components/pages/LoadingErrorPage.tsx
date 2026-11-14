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
  const stepError = (): LoadingStepError | undefined =>
    props.error instanceof LoadingStepError ? props.error : undefined;
  const fallback = (): LoadingStepFallback | undefined => stepError()?.fallback;

  const message = (): string => {
    // a step's hint says what failed already: its reason goes below (detail)
    const hint = stepError()?.hint;
    if (hint !== undefined) return hint;
    const text =
      props.error instanceof Error ? props.error.message : String(props.error);
    // a loading step's message says what failed to load already
    if (props.error instanceof LoadingStepError) return text;
    const name = page();
    return `Failed to load ${name === undefined ? "the page" : `the ${name} page`}: ${text}`;
  };
  // the failure's own reason, eg. the server's message
  const detail = (): string | undefined => {
    const error = stepError();
    if (error?.hint === undefined) return undefined;
    return error.cause instanceof Error
      ? error.cause.message
      : String(error.cause);
  };

  return (
    <LoadingPage
      error={{
        message: message(),
        onRetry: () => void router.invalidate(),
        fallback: fallback(),
        detail: detail(),
        icon: stepError()?.icon,
      }}
    />
  );
}
