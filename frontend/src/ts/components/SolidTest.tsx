import { createSignal, JSXElement } from "solid-js";

export function SolidTest(): JSXElement {
  const [count, setCount] = createSignal(1);
  const increment = (): void => {
    setCount((count) => count + 1);
  };

  return (
    <>
      <span>Test counter</span>
      <button type="button" onClick={increment}>
        {count()}
      </button>
    </>
  );
}
