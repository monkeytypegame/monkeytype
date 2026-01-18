import { JSX } from "solid-js";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { getLoaderBarSignal } from "../../signals/loader-bar";
import { useVisibilityAnimation } from "../../hooks/useVisibilityAnimation";
import { applyReducedMotion } from "../../utils/misc";

export function LoaderBar(): JSX.Element {
  const [ref, loaderEl] = useRefWithUtils<HTMLDivElement>();

  useVisibilityAnimation({
    element: loaderEl,
    isVisible: () => getLoaderBarSignal()?.action === "show",
    showAnimationOptions: {
      delay: applyReducedMotion(getLoaderBarSignal()?.instant ? 0 : 125),
    },
  });

  return <div id="backgroundLoader" class="hidden" ref={ref}></div>;
}
