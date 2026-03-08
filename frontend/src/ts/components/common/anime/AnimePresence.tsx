import { resolveFirst } from "@solid-primitives/refs";
import { createSwitchTransition } from "@solid-primitives/transition-group";
import { AnimationParams } from "animejs";
import {
  JSXElement,
  ParentProps,
  createSignal,
  createContext,
  type Context,
  type Accessor,
  batch,
  onCleanup,
  onMount,
} from "solid-js";

export type AnimePresenceAPI = {
  exit?: AnimationParams;
  playExitAnimation: () => Promise<void>;
  cancelExitAnimation: () => void;
};

export type PresenceContextState = {
  initial: boolean;
  mount: Accessor<boolean>;
  register: (element: HTMLElement, api: AnimePresenceAPI) => void;
  unregister: (element: HTMLElement) => void;
};

export const AnimePresenceContext: Context<PresenceContextState | undefined> =
  createContext<PresenceContextState>();

/**
 * Props for the AnimePresence component
 */
export type AnimePresenceProps = ParentProps<{
  /**
   * If `false`, will disable the first animation on all child Anime elements
   * the first time AnimePresence is rendered.
   * @default true
   */
  initial?: boolean;

  /**
   * If `true`, AnimePresence will wait for the exiting element to finish
   * animating out before animating in the next one.
   * Only applies to single-child mode (when used with Show, Switch, etc.).
   * @default false
   */
  exitBeforeEnter?: boolean;

  /**
   * Enable list mode for animating multiple children (e.g., with For loops).
   * - `"list"`: uses MutationObserver to handle exit animations for dynamic lists.
   * - `"single"`: uses single-child transition logic (for Show, Switch, etc.).
   */
  mode?: "list" | "single";
}>;

/**
 * AnimePresence enables exit animations for components using the `<Anime>` component.
 *
 * When a child component is removed from the tree, AnimePresence delays its unmounting
 * to allow exit animations (defined via the `exit` prop on `<Anime>`) to complete.
 *
 * ## Features
 *
 * - **Exit animations**: Automatically handles exit animations for removing children
 * - **Multiple modes**: Control whether exit and enter animations run in sequence or parallel
 * - **Conditional rendering**: Works with `<Show>`, `<Switch>`, and other control flow components
 *
 * ## Important Notes
 *
 * - Children should have unique `key` props when rendering lists or conditionally
 * - The `exit` prop on `<Anime>` components only works when wrapped in `<AnimePresence>`
 * - Exit animations are detected based on child removal from the component tree
 *
 * @example
 * Basic usage with conditional rendering:
 * ```tsx
 * const [show, setShow] = createSignal(true);
 *
 * <AnimePresence>
 *   <Show when={show()}>
 *     <Anime
 *       initial={{ opacity: 0 }}
 *       animate={{ opacity: 1, duration: 300 }}
 *       exit={{ opacity: 0, duration: 300 }}
 *     >
 *       <div>Content with exit animation</div>
 *     </Anime>
 *   </Show>
 * </AnimePresence>
 * ```
 *
 * @example
 * Wait for exit before entering:
 * ```tsx
 * const [currentView, setCurrentView] = createSignal<"a" | "b">("a");
 *
 * <AnimePresence exitBeforeEnter>
 *   <Show when={currentView() === "a"}>
 *     <Anime exit={{ opacity: 0, translateX: -100, duration: 300 }}>
 *       <div>View A</div>
 *     </Anime>
 *   </Show>
 *   <Show when={currentView() === "b"}>
 *     <Anime exit={{ opacity: 0, translateX: 100, duration: 300 }}>
 *       <div>View B</div>
 *     </Anime>
 *   </Show>
 * </AnimePresence>
 * ```
 *
 * @example
 * List animations:
 * ```tsx
 * const [items, setItems] = createSignal([1, 2, 3]);
 *
 * <AnimePresence>
 *   <For each={items()}>
 *     {(item) => (
 *       <Anime
 *         initial={{ opacity: 0, scale: 0.8 }}
 *         animate={{ opacity: 1, scale: 1, duration: 300 }}
 *         exit={{ opacity: 0, scale: 0.8, duration: 300 }}
 *       >
 *         <div>Item {item}</div>
 *       </Anime>
 *     )}
 *   </For>
 * </AnimePresence>
 * ```
 */
export function AnimePresence(props: AnimePresenceProps): JSXElement {
  const [mount, setMount] = createSignal(true);

  // Registry to track elements and their exit animations
  const exitRegistry = new WeakMap<HTMLElement, AnimePresenceAPI>();

  // For list mode: track which elements are exiting
  const exitingElements = new Set<HTMLElement>();

  let containerRef: HTMLDivElement | undefined;
  let observer: MutationObserver | undefined;

  const setContainerRef = (el: HTMLDivElement): void => {
    containerRef = el;
  };

  const reinsertElement = (
    element: HTMLElement,
    target: Node,
    nextSibling: Node | null,
  ): void => {
    if (nextSibling) {
      target.insertBefore(element, nextSibling);
    } else {
      target.appendChild(element);
    }
  };

  const handleMutations = (mutations: MutationRecord[]): void => {
    for (const mutation of mutations) {
      for (const removed of Array.from(mutation.removedNodes)) {
        if (removed.nodeType !== Node.ELEMENT_NODE) continue;
        const element = removed as HTMLElement;

        // Check if this element has exit animation registered
        const api = exitRegistry.get(element);

        if (api?.exit && !exitingElements.has(element)) {
          exitingElements.add(element);
          reinsertElement(element, mutation.target, mutation.nextSibling);

          void api.playExitAnimation().then(() => {
            exitingElements.delete(element);
            exitRegistry.delete(element);
            element.remove();
          });
          continue;
        }

        // Check direct children for registered elements
        if (element.children.length === 0) continue;

        for (const child of Array.from(element.children)) {
          const childEl = child as HTMLElement;
          const childApi = exitRegistry.get(childEl);

          if (childApi?.exit && !exitingElements.has(childEl)) {
            exitingElements.add(childEl);
            reinsertElement(element, mutation.target, mutation.nextSibling);

            void childApi.playExitAnimation().then(() => {
              exitingElements.delete(childEl);
              exitRegistry.delete(childEl);
              element.remove();
            });
            break;
          }
        }
      }
    }
  };

  const state: PresenceContextState = {
    initial: props.initial ?? true,
    mount,
    register: (element: HTMLElement, api: AnimePresenceAPI) => {
      exitRegistry.set(element, api);
    },
    unregister: (element: HTMLElement) => {
      exitRegistry.delete(element);
    },
  };

  // List mode: Watch for DOM changes in the container
  // oxlint-disable-next-line solid/reactivity -- mode controls component structure at mount time; treated as stable
  if (props.mode === "list") {
    onMount(() => {
      if (!containerRef) return;

      // Set up observer to watch for child removals
      observer = new MutationObserver(handleMutations);
      observer.observe(containerRef, { childList: true, subtree: true });
    });

    onCleanup(() => {
      observer?.disconnect();
    });

    // oxlint-disable-next-line solid/components-return-once -- early return is intentional; mode is structural
    return (
      <AnimePresenceContext.Provider value={state}>
        <div ref={setContainerRef} style={{ display: "contents" }}>
          {props.children}
        </div>
      </AnimePresenceContext.Provider>
    );
  }

  // Single mode: handle single child switching (original behavior)
  // Track currently exiting element and its done callback
  let currentlyExiting: {
    element: HTMLElement;
    api: AnimePresenceAPI;
    done: () => void;
  } | null = null;

  const render = (
    <AnimePresenceContext.Provider value={state}>
      {
        // @ts-expect-error - createSwitchTransition type incompatibility
        createSwitchTransition(
          resolveFirst(() => props.children),
          {
            appear: state.initial,
            mode: props.exitBeforeEnter ? "out-in" : "parallel",
            onExit(el: Element, done: () => void) {
              const htmlEl = el as HTMLElement;
              const api = exitRegistry.get(htmlEl);

              batch(() => {
                setMount(false);
                if (api?.exit) {
                  // Store reference to currently exiting element and its done callback
                  currentlyExiting = { element: htmlEl, api, done };

                  // Listen for animation completion event, similar to solid-motionone
                  htmlEl.addEventListener(
                    "animecomplete",
                    () => {
                      done();
                      if (currentlyExiting?.element === htmlEl) {
                        currentlyExiting = null;
                      }
                    },
                    { once: true },
                  );
                  void api.playExitAnimation().then(() => {
                    exitRegistry.delete(htmlEl);
                  });
                } else {
                  done();
                }
              });
            },
            onEnter(_: Element, done: () => void) {
              batch(() => {
                // If exitBeforeEnter is false and there's an element exiting,
                // cancel the exit animation and complete the transition immediately
                if (!props.exitBeforeEnter && currentlyExiting) {
                  const { element, api, done: exitDone } = currentlyExiting;
                  api.cancelExitAnimation();
                  exitRegistry.delete(element);
                  // Complete the exit transition so SolidJS can clean up properly
                  exitDone();
                  currentlyExiting = null;
                }

                setMount(true);
              });
              done();
            },
          },
        ) as JSXElement
      }
    </AnimePresenceContext.Provider>
  );

  return render;
}
