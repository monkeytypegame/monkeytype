import { createSignal, JSXElement, onCleanup } from "solid-js";

import { AnimeShow } from "../components/common/anime";
import { Fa } from "../components/common/Fa";

export function useSavedIndicator(): {
  component: () => JSXElement;
  flash: () => void;
  hide: () => void;
} {
  const [show, setShow] = createSignal(false);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function clear(): void {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  }

  function flash(): void {
    clear();
    setShow(true);
    timeout = setTimeout(() => {
      setShow(false);
      timeout = undefined;
    }, 2000);
  }

  function hide(): void {
    clear();
    setShow(false);
  }

  function component(): JSXElement {
    return (
      <AnimeShow when={show()}>
        <div class="absolute top-0 right-0 rounded bg-sub-alt p-[0.5em] text-main">
          <Fa icon="fa-save" fixedWidth />
        </div>
      </AnimeShow>
    );
  }

  onCleanup(clear);

  return { component, flash, hide };
}
