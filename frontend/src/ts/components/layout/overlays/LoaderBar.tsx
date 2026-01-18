import { JSX } from "solid-js";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { useVisibilityAnimation } from "../../../hooks/useVisibilityAnimation";
import { getLoaderBarSignal } from "../../../signals/loader-bar";
import { applyReducedMotion } from "../../../utils/misc";

export function LoaderBar(): JSX.Element {
  const [ref, loaderEl] = useRefWithUtils<HTMLDivElement>();

  useVisibilityAnimation({
    element: loaderEl,
    isVisible: () => getLoaderBarSignal()?.visible === true,
    showAnimationOptions: {
      delay: applyReducedMotion(getLoaderBarSignal()?.instant ? 0 : 125),
    },
  });

  return (
    <div
      class="pointer-events-none fixed top-0 z-9999 hidden h-1 w-full animate-[loader] bg-main"
      style={{
        "animation-duration": "2s",
        "animation-iteration-count": "infinite",
      }}
      ref={ref}
    ></div>
  );
}
