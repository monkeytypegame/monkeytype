import { useMatch } from "@tanstack/solid-router";
import { Component, JSXElement, onMount, Suspense } from "solid-js";
import { Dynamic } from "solid-js/web";

import type { PageName } from "../../router/routes";

import { setVisiblePage } from "../../states/router";
import { cn } from "../../utils/cn";
import { capitalizeFirstLetter } from "../../utils/strings";
import { LoadingPage } from "../pages/LoadingPage";

type PageProps = {
  name: PageName;
  content: Component;
};

/**
 * The wrapper of one page (`.page#page<Name>`). The page fade moves the
 * element around it in and out (see PageSwitcher), which builds a page only
 * once the old one is gone: it mounts in the document.
 */
function Page(props: PageProps): JSXElement {
  onMount(() => setVisiblePage(props.name));

  const id = (): string => `page${capitalizeFirstLetter(props.name)}`;

  return (
    <div
      id={id()}
      class={cn("page", id(), "full-width content-grid")}
      data-nosnippet={props.name === "test" ? "" : undefined}
    >
      {/* last-resort net: the router wraps every match in Suspense
          (solid-router #7829) showing its pending component (nothing), so
          a read that suspends without a closer boundary would blank the
          whole page. Caught here it shows the loading page's spinner
          instead */}
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
