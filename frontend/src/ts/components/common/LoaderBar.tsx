import { createEffect, JSX } from "solid-js";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { JSAnimation } from "animejs";
import { getLoaderBarSignal } from "../../signals/loader-bar";

export function LoaderBar(): JSX.Element {
  const [ref, loaderEl] = useRefWithUtils<HTMLDivElement>();
  let showAnimation: JSAnimation | null = null;

  createEffect(() => {
    const signal = getLoaderBarSignal();
    const element = loaderEl();

    if (signal === null || element === undefined) return;

    if (signal.action === "show") {
      showAnimation = element.animate({
        opacity: 1,
        duration: 125,
        delay: signal.instant ? 0 : 125,
        onBegin: () => {
          element.removeClass("hidden");
        },
      });
    } else {
      showAnimation?.pause();
      element.animate({
        opacity: 0,
        duration: 125,
        onComplete: () => {
          element.addClass("hidden");
        },
      });
    }
  });

  return <div id="backgroundLoader" class="hidden" ref={ref}></div>;
}
