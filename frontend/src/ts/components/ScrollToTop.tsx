import { JSXElement, createSignal, onMount, onCleanup } from "solid-js";
import * as ActivePage from "../states/active-page";
import styles from "./ScrollToTop.module.scss";

export function hideScrollToTop(): void {
  // setVisible(false);
}

export function ScrollToTop(): JSXElement {
  const [visible, setVisible] = createSignal(false);
  const handleScroll = () => {
    const page = ActivePage.get();
    if (page === "test") return;

    const scroll = window.scrollY;
    setVisible(scroll > 100);
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return (
    <div class={`content-grid ${styles["container"]}`}>
      <div
        class={`breakout ${styles["button"]}`}
        classList={{
          invisible: !visible(),
        }}
        onClick={() => {
          setVisible(false);
          window.scrollTo({
            top: 0,
            behavior: "instant",
          });
        }}
      >
        <i class="fas fa-angle-double-up"></i>
      </div>
    </div>
  );
}
