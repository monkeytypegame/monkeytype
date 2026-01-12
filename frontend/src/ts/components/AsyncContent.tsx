import { ErrorBoundary, JSXElement, Resource, Show, Suspense } from "solid-js";
import { createErrorMessage } from "../utils/misc";

export default function AsyncContent<T>(props: {
  resource: Resource<T | undefined>;
  errorMessage?: string;
  children: (data: T) => JSXElement;
}): JSXElement {
  return (
    <ErrorBoundary
      fallback={(err) => (
        <div class="error">
          {createErrorMessage(err, props.errorMessage ?? "An error occurred")}
        </div>
      )}
    >
      <Suspense
        fallback={
          <div class="preloader">
            <i class="fas fa-fw fa-spin fa-circle-notch"></i>
          </div>
        }
      >
        <Show when={props.resource() !== undefined}>
          {props.children(props.resource() as T)}
        </Show>
      </Suspense>
    </ErrorBoundary>
  );
}
