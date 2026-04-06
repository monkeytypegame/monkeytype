import { createEffect, createSignal, JSXElement } from "solid-js";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange?: (value: number) => void;
  text?: (value: number) => string | JSXElement;
};

export function Slider(props: Props): JSXElement {
  // oxlint-disable-next-line solid/reactivity
  const [value, setValue] = createSignal(props.value);

  createEffect(() => setValue(props.value));

  const textToDisplay = () => {
    if (props.text) {
      return props.text(value());
    }
    return value();
  };

  return (
    <div class="grid grid-cols-[3ch_1fr] items-center gap-4">
      <div>{textToDisplay()}</div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={value()}
        step={props.step}
        onInput={(e) => setValue(Number(e.target.value))}
        onChange={(e) => props.onChange?.(Number(e.target.value))}
      />
    </div>
  );
}
