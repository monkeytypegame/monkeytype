import { JSXElement, createSignal, onMount, onCleanup } from "solid-js";
import * as ActivePage from "../states/active-page";
import "./ScrollToTop.scss";

const [visible, setVisible] = createSignal(false);

export function hideScrollToTop(): void {
  setVisible(false);
}

export function ScrollToTop(): JSXElement {
  const handleScroll = (): void => {
    const page = ActivePage.get();
    if (page === "test") return;

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
          invisible: !visible(),
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

export const __testing = {
  resetState: (): void => {
    setVisible(false);
  },
};
