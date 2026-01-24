import {
  animate as animejsAnimate,
  AnimationParams,
  JSAnimation,
} from "animejs";
import { JSXElement, ParentProps, createEffect, onCleanup } from "solid-js";
import { Dynamic } from "solid-js/web";

import { applyReducedMotion } from "../../../utils/misc";

/**
 * Props for the AnimeGroup component
 */
export type AnimeGroupProps = ParentProps<{
  /**
   * Animation parameters to apply to all children.
   */
  animation: AnimationParams;

  /**
   * Stagger delay between each child animation in milliseconds.
   * Can be a number for uniform delay, or a function for custom stagger timing.
   * @default 50
   */
  stagger?: number | ((index: number, total: number) => number);

  /**
   * Direction of stagger effect.
   * - "forward": First to last child (default)
   * - "reverse": Last to first child
   * - "center": From center outward
   * @default "forward"
   */
  direction?: "forward" | "reverse" | "center";

  /**
   * Initial state applied to all children before animation starts.
   */
  initial?: Partial<AnimationParams>;

  /**
   * Apply reduced motion settings automatically.
   * When true, animation durations will be set to 0 if user prefers reduced motion.
   * @default true
   */
  respectReducedMotion?: boolean;

  /**
   * Tag name for the wrapper element.
   * @default "div"
   */
  as?: keyof HTMLElementTagNameMap;

  /**
   * CSS class name for the wrapper element.
   */
  class?: string;

  /**
   * CSS styles for the wrapper element.
   */
  style?: string | Record<string, string>;
}>;

/**
 * A component that applies staggered animations to multiple children.
 *
 * AnimeGroup animates all direct children with a configurable delay between each,
 * creating a cascading or staggered animation effect. This is useful for lists,
 * grids, and any group of elements that should animate in sequence.
 *
 * ## Features
 *
 * - **Staggered animations**: Automatically staggers animations across children
 * - **Flexible timing**: Control stagger delay with fixed or dynamic values
 * - **Multiple directions**: Animate forward, reverse, or from center
 * - **Initial state**: Set starting state for all children
 * - **Reduced motion support**: Respects user's motion preferences
 *
 * @example
 * Basic staggered list:
 * ```tsx
 * <AnimeGroup
 *   animation={{ opacity: [0, 1], translateY: [-20, 0], duration: 400 }}
 *   stagger={50}
 * >
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </AnimeGroup>
 * ```
 *
 * @example
 * Reverse stagger with initial state:
 * ```tsx
 * <AnimeGroup
 *   initial={{ opacity: 0, scale: 0.8 }}
 *   animation={{ opacity: 1, scale: 1, duration: 300, easing: "easeOutBack" }}
 *   stagger={100}
 *   direction="reverse"
 * >
 *   <For each={items()}>
 *     {(item) => <div class="card">{item}</div>}
 *   </For>
 * </AnimeGroup>
 * ```
 *
 * @example
 * Dynamic stagger timing:
 * ```tsx
 * <AnimeGroup
 *   animation={{ opacity: 1, translateX: 0, duration: 500 }}
 *   stagger={(index, total) => {
 *     // Accelerating stagger
 *     return 100 * (1 - index / total);
 *   }}
 *   direction="center"
 * >
 *   {children}
 * </AnimeGroup>
 * ```
 *
 * @example
 * With For loop rendering:
 * ```tsx
 * const [items, setItems] = createSignal(['A', 'B', 'C', 'D']);
 *
 * <AnimeGroup
 *   animation={{
 *     opacity: [0, 1],
 *     rotateX: [-90, 0],
 *     duration: 600,
 *     easing: "easeOutExpo"
 *   }}
 *   stagger={75}
 * >
 *   <For each={items()}>
 *     {(item) => <div class="grid-item">{item}</div>}
 *   </For>
 * </AnimeGroup>
 * ```
 */
export function AnimeGroup(props: AnimeGroupProps): JSXElement {
  const stagger = props.stagger ?? 50;
  const direction = props.direction ?? "forward";
  const respectReducedMotion = props.respectReducedMotion ?? true;
  const Component = props.as ?? "div";

  let containerElement: HTMLElement | undefined;
  let animations: JSAnimation[] = [];

  const applyInitialState = (
    element: HTMLElement,
    params: Partial<AnimationParams>,
  ): void => {
    Object.entries(params).forEach(([key, value]) => {
      if (key === "duration" || key === "easing" || key === "delay") return;

      // Handle array values (take the first value as initial)
      const initialValue = Array.isArray(value) ? value[0] : value;

      if (typeof initialValue === "number") {
        element.style[parseInt(key)] = String(initialValue);
      } else if (typeof initialValue === "string") {
        element.style[parseInt(key)] = initialValue;
      }
    });
  };

  const calculateStaggerDelay = (index: number, total: number): number => {
    let baseDelay: number;

    if (typeof stagger === "function") {
      baseDelay = stagger(index, total);
    } else {
      baseDelay = stagger;
    }

    // Apply direction
    if (direction === "reverse") {
      return baseDelay * (total - 1 - index);
    } else if (direction === "center") {
      const center = Math.floor(total / 2);
      const distanceFromCenter = Math.abs(center - index);
      return baseDelay * distanceFromCenter;
    } else {
      // forward (default)
      return baseDelay * index;
    }
  };

  const animateChildren = (): void => {
    if (!containerElement) return;

    // Clear previous animations
    animations.forEach((anim) => anim.pause());
    animations = [];

    const children = Array.from(containerElement.children) as HTMLElement[];
    const total = children.length;

    children.forEach((child, index) => {
      // Apply initial state if provided
      if (props.initial) {
        applyInitialState(child, props.initial);
      }

      const delay = calculateStaggerDelay(index, total);
      const originalDelay = props.animation.delay ?? 0;
      const totalDelay =
        typeof originalDelay === "number" ? originalDelay + delay : delay;

      // Apply animation with stagger delay
      const animParams: AnimationParams = {
        ...props.animation,
        delay: totalDelay,
      };

      // Apply reduced motion if enabled
      if (
        respectReducedMotion &&
        animParams.duration !== undefined &&
        typeof animParams.duration === "number"
      ) {
        animParams.duration = applyReducedMotion(animParams.duration);
      }

      const animation = animejsAnimate(child, animParams);
      animations.push(animation);
    });
  };

  // Animate on mount and when children change
  createEffect(() => {
    // This effect tracks the resolved children
    if (containerElement) {
      // Use setTimeout to ensure DOM is updated with new children
      setTimeout(() => animateChildren(), 0);
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    animations.forEach((anim) => anim.pause());
    animations = [];
  });

  return (
    <Dynamic
      component={Component as keyof HTMLElementTagNameMap}
      ref={(el: HTMLElement) => (containerElement = el)}
      class={props.class}
      style={props.style}
    >
      {props.children}
    </Dynamic>
  );
}

/**
 * Utility function to create stagger timing functions.
 *
 * @example
 * ```tsx
 * <AnimeGroup
 *   animation={{ opacity: 1 }}
 *   stagger={createStagger({ base: 50, ease: "easeOut" })}
 * >
 *   {children}
 * </AnimeGroup>
 * ```
 */
export function createStagger(options: {
  base: number;
  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut";
  from?: "start" | "end" | "center";
}): (index: number, total: number) => number {
  const { base, ease = "linear", from = "start" } = options;

  return (index: number, total: number): number => {
    // Calculate normalized position (0 to 1)
    let position: number;

    if (from === "end") {
      position = 1 - index / (total - 1);
    } else if (from === "center") {
      const center = (total - 1) / 2;
      position = Math.abs(center - index) / center;
    } else {
      position = index / (total - 1);
    }

    // Apply easing
    let easedPosition: number;

    switch (ease) {
      case "easeIn":
        easedPosition = position * position;
        break;
      case "easeOut":
        easedPosition = 1 - Math.pow(1 - position, 2);
        break;
      case "easeInOut":
        easedPosition =
          position < 0.5
            ? 2 * position * position
            : 1 - Math.pow(-2 * position + 2, 2) / 2;
        break;
      default:
        easedPosition = position;
    }

    return base * easedPosition * (total - 1);
  };
}
