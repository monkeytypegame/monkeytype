import { JSXElement, createSignal, onMount, onCleanup } from "solid-js";
import { getActivePage } from "../../../signals/core";
import "./ScrollToTop.scss";

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
    <div class={`content-grid ScrollToTop`}>
      <div
        class={`breakout button`}
        classList={{
          invisible: getActivePage() === "test" || !visible(),
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
      </div>
    </div>
  );
}
