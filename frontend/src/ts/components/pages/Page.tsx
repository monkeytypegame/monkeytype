import { useMatch } from "@tanstack/solid-router";
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
import { LoadingCircle } from "../common/LoadingCircle";
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
        <Suspense
          fallback={
            <div class="grid h-full content-center justify-center">
              <LoadingCircle class="mb-4 text-[2rem]" />
              {capitalizeFirstLetter(props.name)} page is loading...
            </div>
          }
        >
          <Dynamic component={props.content} />
        </Suspense>
      </Show>
    </div>
  );
}

/**
 * A route component rendering `content` as the page its route names in
 * `staticData.page` (the one place a route's page is named).
 */
export function routePage(
  content: Component,
  options: { class?: string } = {},
): Component {
  return () => {
    // read once: the page keeps its name while it fades out
    const name = useMatch({
      strict: false,
      select: (match) => match.staticData.page,
    })();
    if (name === undefined) {
      throw new Error("A route rendering a page needs staticData.page");
    }
    return <Page name={name} content={content} class={options.class} />;
  };
}

/** A component rendering `content` as page `name` (eg. a route's not found or pending component). */
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
