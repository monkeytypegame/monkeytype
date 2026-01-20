import { JSXElement, createSignal, onMount, onCleanup } from "solid-js";

import { getActivePage } from "../../../signals/core";

export function ScrollToTop(): JSXElement {
  const [visible, setVisible] = createSignal(false);

  const handleScroll = (): void => {
    if (getActivePage() === "test") return;

    const scroll = window.scrollY;
    setVisible(scroll > 100);
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
        class="breakout bg-sub-alt text-sub ring-bg hover:text-bg pointer-events-auto mb-8 grid h-16 w-16 place-self-end rounded-full text-[2rem] ring-8"
        style={{
          "grid-column": "content-end/breakout-end",
        }}
        tabIndex="-1"
        type="button"
        classList={{
          "opacity-0": getActivePage() === "test" || !visible(),
          "pointer-events-none": getActivePage() === "test" || !visible(),
        }}
        onClick={() => {
          setVisible(false);
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }}
      >
        <i class="fas fa-angle-double-up"></i>
      </button>
    </div>
  );
}
