import {
  animate as animejsAnimate,
  AnimationParams,
  JSAnimation,
} from "animejs";
import {
  JSXElement,
  ParentProps,
  createEffect,
  onCleanup,
  splitProps,
  mergeProps,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import { applyReducedMotion } from "../../../utils/misc";
import { AnimePresenceContext } from "./AnimePresence";

/**
 * Props for the Anime component
 *
 * @example
 * Basic usage:
 * ```tsx
 * <Anime animation={{ opacity: [0, 1], duration: 300 }}>
 *   <div>Fade in content</div>
 * </Anime>
 * ```
 *
 * @example
 * With initial state and lifecycle animations:
 * ```tsx
 * <Anime
 *   initial={{ opacity: 0, translateY: -20 }}
 *   animate={{ opacity: 1, translateY: 0, duration: 400 }}
 * >
 *   <div>Slide and fade in</div>
 * </Anime>
 * ```
 *
 * @example
 * With reactive animations:
 * ```tsx
 * const [visible, setVisible] = createSignal(true);
 *
 * <Anime animation={{ opacity: visible() ? 1 : 0, duration: 200 }}>
 *   <div>Toggle visibility</div>
 * </Anime>
 * ```
 */
export type AnimeProps = ParentProps<{
  /**
   * Initial animation state applied before component mounts.
   * Properties set here will be applied immediately without animation.
   */
  initial?: Partial<AnimationParams>;

  /**
   * Target animation state. If `initial` is provided, animates from initial to this state.
   * If only `animation` is provided without `initial`, this is used directly.
   */
  animate?: AnimationParams;

  /**
   * Direct animation parameters (alternative to initial/animate pattern).
   * Use this for simple animations without initial state.
   */
  animation?: AnimationParams;

  /**
   * Exit animation state (applied when component unmounts).
   * Note: Requires wrapping in <AnimePresence> to function properly.
   */
  exit?: AnimationParams;

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
 * A declarative anime.js wrapper component for SolidJS with a Motion One-style API.
 *
 * This component automatically handles animation lifecycle, cleanup, and reactivity.
 * It wraps children in a container element and applies anime.js animations.
 *
 * ## Features
 *
 * - **Declarative API**: Define animations with `initial`, `animate`, and `exit` props
 * - **Automatic cleanup**: Animations are canceled when component unmounts
 * - **Reactive**: Animations update when props change
 * - **Reduced motion support**: Respects user's motion preferences by default
 * - **Flexible**: Works with any valid anime.js animation parameters
 *
 * @example
 * Simple fade in:
 * ```tsx
 * <Anime animation={{ opacity: 1, duration: 300 }}>
 *   <p>Content</p>
 * </Anime>
 * ```
 *
 * @example
 * Mount/unmount animations:
 * ```tsx
 * <Anime
 *   initial={{ opacity: 0, scale: 0.8 }}
 *   animate={{ opacity: 1, scale: 1, duration: 400, easing: "easeOutElastic(1, .6)" }}
 * >
 *   <div>Bouncy entrance</div>
 * </Anime>
 * ```
 *
 * @example
 * Reactive animations with signals:
 * ```tsx
 * const [isExpanded, setIsExpanded] = createSignal(false);
 *
 * <Anime
 *   animation={{
 *     height: isExpanded() ? "auto" : "60px",
 *     duration: 300,
 *     easing: "easeInOutQuad"
 *   }}
 * >
 *   <div>Expandable content</div>
 * </Anime>
 * ```
 */
export function Anime(props: AnimeProps): JSXElement {
  const merged = mergeProps(
    {
      respectReducedMotion: true,
      as: "div" as const,
    },
    props,
  );

  const [local, others] = splitProps(merged, [
    "children",
    "initial",
    "animate",
    "animation",
    "exit",
    "respectReducedMotion",
    "as",
    "class",
    "style",
  ]);

  let element: HTMLElement | undefined = undefined;
  let currentAnimation: JSAnimation | undefined;
  let exitAnimation: JSAnimation | undefined;
  let exitAnimationResolve: (() => void) | undefined;
  let hasInitialized = false;
  // Get presence context if available
  const presenceContext = useContext(AnimePresenceContext);

  // Cancel exit animation if it's running
  const cancelExitAnimation = (): void => {
    if (exitAnimation) {
      // Pause the animation to stop it
      exitAnimation.pause();
      exitAnimation = undefined;
      // Resolve the promise to allow cleanup
      if (exitAnimationResolve) {
        exitAnimationResolve();
        exitAnimationResolve = undefined;
      }
    }
  };

  // Create exit animation handler
  const playExitAnimation = async (): Promise<void> => {
    if (!element || !local.exit) return;

    // Cancel any running animation
    if (currentAnimation) {
      currentAnimation.pause();
      currentAnimation = undefined;
    }

    // If height is currently "auto", snap it to a pixel value so anime.js can
    // interpolate from a concrete number during the exit animation.
    if (element.style.height === "auto") {
      element.style.height = `${element.offsetHeight}px`;
    }

    // Apply reduced motion if enabled
    const exitParams =
      local.respectReducedMotion &&
      local.exit.duration !== undefined &&
      typeof local.exit.duration === "number"
        ? { ...local.exit, duration: applyReducedMotion(local.exit.duration) }
        : local.exit;

    // Play exit animation and wait for completion
    exitAnimation = animejsAnimate(element, exitParams);
    return new Promise((resolve) => {
      exitAnimationResolve = resolve;
      void exitAnimation?.then(() => {
        exitAnimation = undefined;
        exitAnimationResolve = undefined;
        // Dispatch custom event to signal animation completion
        element?.dispatchEvent(new Event("animecomplete"));
        resolve();
      });
    });
  };

  // Register with presence context after element is available
  createEffect(() => {
    if (presenceContext && local.exit && element) {
      presenceContext.register(element, {
        exit: local.exit,
        playExitAnimation,
        cancelExitAnimation,
      });
    }
  });

  // Cleanup registration on unmount
  // Don't unregister if we have exit animation - let AnimePresence handle it
  onCleanup(() => {
    if (presenceContext && element && !local.exit) {
      presenceContext.unregister(element);
    }
  });

  const applyAnimation = (params: AnimationParams): JSAnimation | undefined => {
    if (!element) return undefined;

    // Cancel any running animation
    if (currentAnimation) {
      currentAnimation.pause();
      currentAnimation = undefined;
    }

    // Resolve height: "auto" by measuring the element's natural height
    let resolvedParams = params;
    if (params["height"] === "auto") {
      const currentH = element.offsetHeight;
      element.style.height = "auto";
      const targetH = element.offsetHeight;
      element.style.height = `${currentH}px`;
      const originalOnComplete = params.onComplete;
      resolvedParams = {
        ...params,
        height: targetH,
        onComplete: (anim: JSAnimation) => {
          // Restore auto so the element can resize naturally after animation
          if (element) element.style.height = "auto";
          if (typeof originalOnComplete === "function") {
            originalOnComplete(anim);
          }
        },
      };
    }

    // Apply reduced motion if enabled
    const animParams =
      local.respectReducedMotion &&
      resolvedParams.duration !== undefined &&
      typeof resolvedParams.duration === "number"
        ? {
            ...resolvedParams,
            duration: applyReducedMotion(resolvedParams.duration),
          }
        : resolvedParams;

    currentAnimation = animejsAnimate(element, animParams);
    return currentAnimation;
  };

  const applyInitialState = (params: Partial<AnimationParams>): void => {
    if (!element) return;

    // Apply initial styles directly without animation using anime.js
    // This ensures consistent property name handling with animate
    animejsAnimate(element, {
      ...params,
      duration: 0,
    });
  };

  // Handle initial state and mounting animation
  createEffect(() => {
    // If under AnimePresence with exitBeforeEnter, wait for mount signal
    if (presenceContext && !presenceContext.mount()) return;

    if (!element || hasInitialized) return;

    // Apply initial state if provided
    if (local.initial) {
      applyInitialState(local.initial);
    }

    // Animate to target state
    if (local.animate) {
      applyAnimation(local.animate);
    } else if (local.animation) {
      applyAnimation(local.animation);
    }

    hasInitialized = true;
  });

  // Handle reactive animation updates
  createEffect(() => {
    // Always read reactive params so dependencies are tracked
    const animationParams = local.animate ?? local.animation;

    if (!hasInitialized || !animationParams) return;

    applyAnimation(animationParams);
  });

  // Cleanup on unmount — always pause enter animation; AnimePresence handles exit timing
  onCleanup(() => {
    if (currentAnimation) {
      currentAnimation.pause();
      currentAnimation = undefined;
    }
  });

  const setElementRef = (el: unknown): void => {
    element = el as HTMLElement;
  };

  return (
    <Dynamic
      component={local.as}
      ref={setElementRef}
      class={local.class}
      style={local.style}
      {...others}
    >
      {local.children}
    </Dynamic>
  );
}
