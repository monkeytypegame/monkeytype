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
    <div class="content-grid ScrollToTop fixed w-full h-full pointer-events-none z-999999 top-0 left-0">
      <button
        class="breakout pointer-events-auto text-sub place-self-end rounded-full text-[2rem] w-16 h-16 grid ring-8 ring-bg mb-8 hover:text-bg"
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
