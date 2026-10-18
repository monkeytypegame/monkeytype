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

import type { PageName } from "../../router/routes";

import { cn } from "../../utils/cn";
import { capitalizeFirstLetter } from "../../utils/strings";
import { LoadingPage } from "../pages/LoadingPage";

type PageProps = {
  name: PageName;
  content: Component;
};

/**
 * The wrapper of one page (`.page#page<Name>`). The page fade moves this
 * element in and out (see PageSwitcher). The content mounts only once the
 * wrapper is in the document: the fade builds the next page before inserting
 * it, and page code queries `document` and measures layout on mount.
 */
function Page(props: PageProps): JSXElement {
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
      class={cn("page", id(), "full-width content-grid")}
      data-nosnippet={props.name === "test" ? "" : undefined}
      ref={(el) => (pageEl = el)}
    >
      <Show when={isAttached()}>
        {/* last-resort net: the router wraps every match in Suspense
            (solid-router #7829), so a read that suspends without a closer
            boundary would swap the whole page out and fade it in again.
            Caught here it shows the loading page's spinner instead */}
        <Suspense
          fallback={
            <LoadingPage
              spinner={{
                text: `${capitalizeFirstLetter(props.name)} page is still loading...`,
              }}
            />
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
export function createRouterPage(content: Component): Component {
  return () => {
    // read once: the page keeps its name while it fades out
    const name = useMatch({
      strict: false,
      select: (match) => match.staticData.page,
    })();
    if (name === undefined) {
      throw new Error("A route rendering a page needs staticData.page");
    }
    return <Page name={name} content={content} />;
  };
}

/**
 * A component rendering `content` as page `name` (eg. a route's not found,
 * pending or error component). Its props are passed on to `content`.
 */
export function createNonRouterPage<P extends object>(
  name: PageName,
  content: Component<P>,
): Component<P> {
  return (props) => (
    <Page
      name={name}
      content={() => <Dynamic component={content} {...props} />}
    />
  );
}
