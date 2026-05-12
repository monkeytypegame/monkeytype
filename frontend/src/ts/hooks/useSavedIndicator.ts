import { Accessor, createSignal, onCleanup } from "solid-js";

export function useSavedIndicator(): [
  show: Accessor<boolean>,
  flash: () => void,
  hide: () => void,
] {
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

  onCleanup(clear);

  return [show, flash, hide];
}
