import { createEffect, onCleanup, onMount, type Accessor } from "solid-js";
import tippy, { type Props as TippyProps, type Instance } from "tippy.js";

export type BalloonPosition = "up" | "down" | "left" | "right";

/** Kept for backwards compatibility with existing component APIs. */
export type BalloonProps = {
  text?: string;
  position?: BalloonPosition;
  break?: boolean;
  length?: "small" | "medium" | "large" | "xlarge" | "fit";
};

const POSITION_MAP: Record<BalloonPosition, TippyProps["placement"]> = {
  up: "top",
  down: "bottom",
  left: "left",
  right: "right",
};

function mapLength(
  length: BalloonProps["length"],
): TippyProps["maxWidth"] | undefined {
  if (length === undefined) return undefined;
  switch (length) {
    case "small":
      return 120;
    case "medium":
      return 180;
    case "large":
      return 300;
    case "xlarge":
      return 450;
    case "fit":
      return "fit";
    default:
      return undefined;
  }
}

export function buildTippyProps(
  options: BalloonProps | undefined,
): TippyProps | null {
  if (options === undefined || options.text === "") {
    return null;
  }

  const props: Partial<TippyProps> = {
    content: options.text ?? "",
    placement: POSITION_MAP[options.position ?? "up"],
    arrow: false,
    trigger: "mouseenter focus",
  };

  const maxLen = mapLength(options.length);
  if (maxLen !== undefined) {
    props.maxWidth = maxLen;
  }

  return props as TippyProps;
}

/**
 * Imperative utility for vanilla JS / legacy code that previously set
 * `aria-label` + `data-balloon-pos` attributes to get balloon-css tooltips.
 */
export function createTippy(
  el: Element | null | undefined,
  options?: BalloonProps,
): Instance | null {
  if (!el) return null;
  const props = buildTippyProps(options);
  if (!props) return null;
  return tippy(el as HTMLElement, props);
}

/**
 * SolidJS composable: attaches a tippy tooltip to an element via ref.
 * Use `getOptions` (reactive accessor returning BalloonProps | undefined).
 * Returns `{ ref }` — spread onto the target JSX element.
 */
export function useTippy(getOptions: Accessor<BalloonProps | undefined>): {
  ref: (el: HTMLElement | null) => void;
} {
  let elHolder: HTMLElement | null = null;

  onMount(() => {
    initOrUpdate();
  });

  // Re-run when options change.
  createEffect(() => {
    getOptions(); // track dependency
    if (elHolder) {
      destroyTippy(elHolder);
      initOrUpdate();
    }
  });

  function initOrUpdate(): void {
    const props = buildTippyProps(getOptions());
    if (!props || !elHolder) return;
    tippy(elHolder, props);
  }

  onCleanup(() => destroyTippy(elHolder));

  return {
    ref(node: HTMLElement | null) {
      elHolder = node;
    },
  };
}

/** Destroy any tippy instance attached to an element. */
function destroyTippy(el: HTMLElement | null): void {
  if (!el) return;
  (el as { _tippy?: Instance })._tippy?.destroy();
}
