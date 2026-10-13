import {
  Component,
  createSignal,
  JSXElement,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import type { PageName } from "../../states/router";

import { cn } from "../../utils/cn";
import { capitalizeFirstLetter } from "../../utils/strings";
import { LoadingPage } from "./LoadingPage";

type PageProps = {
  name: PageName;
  content: Component;
  class?: string;
};

/**
 * The wrapper of one page (`.page#page<Name>`). The page fade moves this
 * element in and out (see RootLayout). The content mounts only once the
 * wrapper is in the document: the fade builds the next page before inserting
 * it, and page code queries `document` and measures layout on mount.
 */
export function Page(props: PageProps): JSXElement {
  const [isAttached, setAttached] = createSignal(false);
  let pageEl: HTMLElement | undefined;
  let frame: number | undefined;
  let isDisposed = false;
  onCleanup(() => {
    isDisposed = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
  });

  // runs before the fade inserts the wrapper: wait until it is attached
  onMount(() => {
    const check = (): void => {
      if (isDisposed) return;
      if (pageEl?.isConnected === true) {
        frame = undefined;
        setAttached(true);
        return;
      }
      frame = requestAnimationFrame(check);
    };
    queueMicrotask(check);
  });

  const id = (): string => `page${capitalizeFirstLetter(props.name)}`;

  return (
    <div
      id={id()}
      class={cn("page", id(), props.class)}
      data-nosnippet={props.name === "test" ? "" : undefined}
      ref={(el) => (pageEl = el)}
    >
      <Show when={isAttached()}>
        {/* last-resort net: the router wraps every match in Suspense
            (solid-router #7829), so a read that suspends without a closer
            boundary would swap the whole page out and fade it in again.
            Caught here it blanks the page instead */}
        <Suspense>
          <Dynamic component={props.content} />
        </Suspense>
      </Show>
    </div>
  );
}

/** A route component rendering `content` as page `name`. */
export function pageComponent(
  name: PageName,
  content: Component,
  options: { class?: string } = {},
): Component {
  return () => <Page name={name} content={content} class={options.class} />;
}

export const loadingPageClass =
  "grid h-full w-full content-center items-center gap-4 place-self-center text-center";

/** The loading page, as the root layout and pending routes render it. */
export const LoadingRoutePage = pageComponent("loading", LoadingPage, {
  class: loadingPageClass,
});
