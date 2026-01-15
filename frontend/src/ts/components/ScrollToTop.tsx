import { JSXElement, createSignal, onMount, onCleanup } from "solid-js";
import { getActivePage } from "../signals/core";
import "./ScrollToTop.scss";

import { navigate } from "../controllers/route-controller";

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
        class={`breakout buttons-wrapper`}
        classList={{
          invisible: getActivePage() === "test" || !visible(),
        }}
      >
        <div
          class="button"
          onClick={() => {
            void navigate("/");
          }}
        >
          <i class="fas fa-fw fa-keyboard"></i>
        </div>
        <div
          class="button"
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
    </div>
  );
}
