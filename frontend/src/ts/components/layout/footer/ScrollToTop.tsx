import { JSXElement, createSignal, onMount, onCleanup } from "solid-js";

import { getActivePage } from "../../../states/core";
import { Fa } from "../../common/Fa";

export function ScrollToTop(): JSXElement {
  const [visible, setVisible] = createSignal(false);
  const [scrolling, setScrolling] = createSignal(false);

  const handleScroll = (): void => {
    if (getActivePage() === "test" || scrolling()) return;
    const scroll = window.scrollY;
    setVisible(scroll > 100);
  };

  const scrollUp = async (): Promise<void> => {
    const scrollEnded = new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
      if (window.scrollY === 0) {
        resolve();
        return;
      }
      window.addEventListener("scrollend", () => resolve(), { once: true });
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    await scrollEnded;
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  });

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return (
    <div class="content-grid ScrollToTop pointer-events-none fixed top-0 left-0 z-999999 h-full w-full">
      <button
        class="breakout pointer-events-auto mb-8 grid h-16 w-16 place-self-end rounded-full bg-sub-alt text-[2rem] text-sub ring-8 ring-bg hover:bg-text hover:text-bg"
        style={{
          "grid-column": "content-end/breakout-end",
        }}
        tabIndex="-1"
        type="button"
        classList={{
          "opacity-0": getActivePage() === "test" || !visible(),
          "pointer-events-none": getActivePage() === "test" || !visible(),
        }}
        onClick={async () => {
          setVisible(false);
          setScrolling(true);
          await scrollUp();
          setScrolling(false);
        }}
      >
        <Fa icon="fa-angle-double-up" />
      </button>
    </div>
  );
}
