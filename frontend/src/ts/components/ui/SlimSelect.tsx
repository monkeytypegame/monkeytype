import SlimSelectCore, { Config } from "slim-select";
import { Optgroup, Option } from "slim-select/store";
import { onMount, onCleanup, createEffect, createSignal } from "solid-js";
import type { JSX, JSXElement } from "solid-js";

export type SlimSelectProps = {
  data?: (Partial<Option> | Partial<Optgroup>)[];
  settings?: Config["settings"] & { scrollToTop?: boolean };
  events?: Config["events"];
  cssClasses?: Config["cssClasses"];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  children?: JSX.Element;
  multiple?: boolean;

  // Solid-style instance exposure
  ref?: (instance: SlimSelectCore | null) => void;
};

export default function SlimSelect(props: SlimSelectProps): JSXElement {
  let selectRef!: HTMLSelectElement;
  let slimSelect: SlimSelectCore | null = null;

  const [isInitialMount, setIsInitialMount] = createSignal(true);
  let currentValue: string | string[] | undefined = props.value;

  const getCleanValue = (
    val: string | string[] | undefined,
  ): string | string[] => {
    if (typeof val === "string") {
      return props.multiple ? [val] : val;
    }

    if (Array.isArray(val)) {
      return props.multiple ? val : (val[0] as string);
    }

    return props.multiple ? [] : "";
  };

  const syncValueToSlimSelect = (
    val: string | string[] | undefined,
    runAfterChange = false,
  ): void => {
    if (!slimSelect) return;
    if (val === undefined) return;

    const cleanValue = getCleanValue(val);

    const data = slimSelect.getData();
    const options = data.flatMap((item) =>
      "label" in item ? item.options : [item],
    );

    const valueExists = Array.isArray(cleanValue)
      ? cleanValue.length > 0 &&
        cleanValue.every((v) => options.some((o) => o.value === v))
      : cleanValue !== "" && options.some((o) => o.value === cleanValue);

    if (!valueExists) {
      if (!Array.isArray(cleanValue)) {
        const hasPlaceholder = options.some((o) => o.placeholder);
        if (!hasPlaceholder) {
          const currentData = slimSelect.getData();
          const placeholderOption: Partial<Option> = {
            value: "",
            text: "",
            placeholder: true,
          };
          //@ts-expect-error todo
          slimSelect.setData([placeholderOption, ...currentData]);
        }
      }
    }

    slimSelect.setSelected(cleanValue, runAfterChange);
  };

  onMount(() => {
    const config: Config = {
      select: selectRef,
    };

    //@ts-expect-error todo
    if (props.data) config.data = props.data;
    if (props.settings) config.settings = props.settings;
    if (props.cssClasses) config.cssClasses = props.cssClasses;

    const ogAfterChange = props.events?.afterChange;
    const ogBeforeOpen = props.events?.beforeOpen;

    config.events = {
      ...props.events,
      afterChange: (newVal) => {
        if (!slimSelect) return;

        const newValue = props.multiple
          ? newVal.map((o) => o.value)
          : (newVal[0]?.value ?? "");

        const slimData = slimSelect.getData();
        const options = slimData.flatMap((item) =>
          "label" in item ? item.options : [item],
        );

        const currentValueExists =
          currentValue === undefined
            ? false
            : Array.isArray(currentValue)
              ? currentValue.length > 0 &&
                currentValue.every((v) => options.some((o) => o.value === v))
              : currentValue !== "" &&
                options.some((o) => o.value === currentValue);

        const newValueIsValid = Array.isArray(newValue)
          ? newValue.length > 0 &&
            newValue.every((v) => options.some((o) => o.value === v))
          : newValue !== "" && options.some((o) => o.value === newValue);

        const valueChanged =
          Array.isArray(newValue) && Array.isArray(currentValue)
            ? JSON.stringify([...newValue].sort()) !==
              JSON.stringify([...(currentValue ?? [])].sort())
            : currentValue !== newValue;

        if (
          props.onChange &&
          valueChanged &&
          (currentValueExists || newValueIsValid)
        ) {
          props.onChange(newValue);
          currentValue = newValue;
        }

        ogAfterChange?.(newVal);
      },
      beforeOpen: () => {
        if (!slimSelect) return;

        if (props.settings?.scrollToTop) {
          const listElement = slimSelect.render.content.list;
          const topListItem = listElement.children.item(0) as HTMLElement;

          listElement.scrollTop = topListItem.offsetTop - listElement.offsetTop;
        }
        ogBeforeOpen?.();
      },
    };

    slimSelect = new SlimSelectCore(config);

    // expose instance
    props.ref?.(slimSelect);

    if (props.value !== undefined) {
      syncValueToSlimSelect(props.value, false);
    }

    setIsInitialMount(false);
  });

  onCleanup(() => {
    slimSelect?.destroy();
    slimSelect = null;
    props.ref?.(null);
  });

  createEffect(() => {
    const value = props.value;

    if (isInitialMount()) {
      currentValue = value;
      return;
    }

    if (slimSelect && value !== undefined) {
      currentValue = value;
      syncValueToSlimSelect(value, false);
    }
  });

  createEffect(() => {
    const data = props.data;

    if (!isInitialMount() && slimSelect && data) {
      //@ts-expect-error todo
      slimSelect.setData(data);

      if (props.value !== undefined) {
        syncValueToSlimSelect(props.value, false);
      }
    }
  });

  return (
    <select ref={(el) => (selectRef = el)} multiple={props.multiple}>
      {props.children}
    </select>
  );
}
