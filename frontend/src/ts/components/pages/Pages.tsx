import { createSwitchTransition } from "@solid-primitives/transition-group";
import { animate } from "animejs";
import {
  children,
  Component,
  createMemo,
  createSignal,
  JSXElement,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import { PageName } from "../../pages/page";
import { getActivePage, isAuthenticated } from "../../states/core";
import { isLoadingShown } from "../../states/loading-page";
import { cn } from "../../utils/cn";
import { applyReducedMotion } from "../../utils/misc";
import { capitalizeFirstLetter } from "../../utils/strings";

export type PageRegistryEntry = {
  component: Component;
  /** Extra classes on the page wrapper. */
  class?: string;
  /** Signed out, the wrapper renders empty. */
  needsAuthentication?: boolean;
};

export type PageRegistry = Record<PageName, PageRegistryEntry>;

// duration of the page fade out and of the fade in
const fadeDuration = 125;

async function fade(el: HTMLElement, opacity: number): Promise<void> {
  return new Promise((resolve) => {
    animate(el, {
      opacity,
      duration: applyReducedMotion(fadeDuration),
      onComplete: () => resolve(),
    });
  });
}

// whether the shown page finished fading in, and who waits for it
let isShownPageIn = true;
let shownPageWaiters: (() => void)[] = [];

function settleShownPage(): void {
  isShownPageIn = true;
  const waiters = shownPageWaiters;
  shownPageWaiters = [];
  for (const resolve of waiters) resolve();
}

/**
 * Resolves once the shown page is fully in: right away when no page change
 * is running, otherwise when the page shown last finished fading in.
 */
export async function waitForShownPage(): Promise<void> {
  if (isShownPageIn) return;
  return new Promise((resolve) => shownPageWaiters.push(resolve));
}

/**
 * Renders the shown page (the loading page while loading is shown, else the
 * active page) and only that page. The old page fades out completely before
 * the new one is inserted and fades in, so two pages are never in the DOM at
 * once (ADR 0002). A page mounts on enter and unmounts on leave (ADR 0001).
 */
export function Pages(props: { registry: PageRegistry }): JSXElement {
  const shownName = createMemo((): PageName =>
    isLoadingShown() ? "loading" : getActivePage(),
  );

  let isFirst = true;
  let shownElement: HTMLElement | undefined;
  const shownEl = createMemo((): HTMLElement => {
    const name = shownName();
    if (isFirst) {
      isFirst = false;
    } else {
      isShownPageIn = false;
    }
    // resolve to the wrapper element: in dev, hot reload wraps components so
    // the JSX is a function, not the element
    const resolved = untrack(() =>
      children(() => <Page name={name} entry={props.registry[name]} />),
    );
    const element = resolved
      .toArray()
      .find((node): node is HTMLElement => node instanceof HTMLElement);
    if (element === undefined) {
      throw new Error(`page ${name} did not render an element`);
    }
    shownElement = element;
    return shownElement;
  });

  onCleanup(settleShownPage);

  // fade ins waiting for their first frame, cancelled if the page leaves first
  const pendingFadeIns = new Map<Element, number>();

  // createSwitchTransition tracks its source itself
  // oxlint-disable-next-line solid/reactivity
  const rendered = createSwitchTransition(shownEl, {
    mode: "out-in",
    // the boot loading page appears instantly
    appear: false,
    onExit: (el, done) => {
      const frame = pendingFadeIns.get(el);
      if (frame !== undefined) {
        // never faded in, still at opacity 0
        cancelAnimationFrame(frame);
        pendingFadeIns.delete(el);
        done();
        return;
      }
      void fade(el, 0).then(done);
    },
    onEnter: (el, done) => {
      // called before the page is attached, and an animation started on a
      // detached element never runs: start on the next frame. Hold the page
      // at opacity 0 until the fade in finished, clearing it earlier can
      // paint one frame of the page fully visible
      el.style.opacity = "0";
      const frame = requestAnimationFrame(() => {
        pendingFadeIns.delete(el);
        void fade(el, 1).then(() => {
          el.style.opacity = "";
          done();
          if (el === shownElement) settleShownPage();
        });
      });
      pendingFadeIns.set(el, frame);
    },
  });

  return <>{rendered()}</>;
}

/**
 * The wrapper of one page (`.page#page<Name>`), moved in and out by the page
 * fade. The content mounts only once the wrapper is in the document: the fade
 * builds the next page before inserting it, and page code queries `document`
 * and measures layout on mount.
 */
function Page(props: { name: PageName; entry: PageRegistryEntry }): JSXElement {
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

  const isAllowed = (): boolean =>
    props.entry.needsAuthentication !== true || isAuthenticated();
  const id = (): string => `page${capitalizeFirstLetter(props.name)}`;

  return (
    <div
      id={id()}
      class={cn("page", id(), props.entry.class)}
      data-nosnippet={props.name === "test" ? "" : undefined}
      ref={(el) => (pageEl = el)}
    >
      <Show when={isAttached() && isAllowed()}>
        <Dynamic component={props.entry.component} />
      </Show>
    </div>
  );
}
