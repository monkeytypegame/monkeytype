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
  addAllOption?: boolean;

  // Solid-style instance exposure
  ref?: (instance: SlimSelectCore | null) => void;
};

export default function SlimSelect(props: SlimSelectProps): JSXElement {
  let selectRef!: HTMLSelectElement;
  let slimSelect: SlimSelectCore | null = null;

  const [isInitialMount, setIsInitialMount] = createSignal(true);
  let currentValue: string | string[] | undefined = props.value;

  // Helper to get all non-"all" option values from data
  const getAllOptionValues = (
    data: (Partial<Option> | Partial<Optgroup>)[],
  ): string[] => {
    const options = data.flatMap((item) =>
      "label" in item && item.options ? item.options : [item],
    );
    return options
      .filter(
        (o): o is Partial<Option> =>
          "value" in o && o.value !== "all" && !o.placeholder,
      )
      .map((o) => o.value as string);
  };

  // Inject "all" option into data if needed
  const getDataWithAll = (
    data?: (Partial<Option> | Partial<Optgroup>)[],
  ): (Partial<Option> | Partial<Optgroup>)[] => {
    if (!props.addAllOption || !props.multiple || !data) return data ?? [];

    const hasAllOption = data.some((item) =>
      "value" in item ? item.value === "all" : false,
    );

    if (hasAllOption) return data;

    const allOption: Partial<Option> = {
      value: "all",
      text: "all",
      selected: false, // Don't auto-select "all" initially
    };

    return [allOption, ...data];
  };

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

    const data = slimSelect.store.getData();
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
          const currentData = slimSelect.store.getData();
          const placeholderOption: Partial<Option> = {
            value: "",
            text: "",
            placeholder: true,
          };
          //@ts-expect-error todo
          slimSelect.store.setData([placeholderOption, ...currentData]);
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
    if (props.data) config.data = getDataWithAll(props.data);
    if (props.settings) config.settings = props.settings;
    if (props.cssClasses) config.cssClasses = props.cssClasses;

    const ogAfterChange = props.events?.afterChange;
    const ogBeforeChange = props.events?.beforeChange;
    const ogBeforeOpen = props.events?.beforeOpen;

    config.events = {
      ...props.events,
      beforeChange: (selectedOptions, oldSelectedOptions) => {
        // Call original beforeChange if it exists
        const ogResult = ogBeforeChange?.(selectedOptions, oldSelectedOptions);
        if (ogResult === false) return false;

        // Handle "all" option logic if enabled
        if (props.addAllOption && props.multiple && slimSelect) {
          const includesAllNow = selectedOptions.some((o) => o.value === "all");
          const includedAllBefore = oldSelectedOptions.some(
            (o) => o.value === "all",
          );

          if (includesAllNow) {
            if (!includedAllBefore) {
              // User clicked "all" -> select all non-"all" options
              const data = slimSelect.store.getData();
              const allValues = getAllOptionValues(data);

              // First update: mark only "all" as selected for the select box display
              for (const item of data) {
                if (!("value" in item)) continue;
                item.selected = item.value === "all";
              }
              slimSelect.store.setData(data);
              slimSelect.render.renderValues();

              // Then update data to mark all options as selected for dropdown display
              for (const item of data) {
                if (!("value" in item)) continue;
                const isAllOrIncluded =
                  item.value === "all" || allValues.includes(item.value);
                item.selected = isAllOrIncluded;
              }

              // Defer final update to next tick
              setTimeout(() => {
                if (!slimSelect) return;
                slimSelect.store.setData(data);
                slimSelect.render.renderOptions(data);
              }, 0);

              // Manually trigger onChange
              if (
                props.onChange &&
                JSON.stringify([...allValues].sort()) !==
                  JSON.stringify(
                    [
                      ...(Array.isArray(currentValue) ? currentValue : []),
                    ].sort(),
                  )
              ) {
                props.onChange(allValues);
                currentValue = allValues;
              }

              return false; // Prevent default behavior
            } else if (selectedOptions.length > oldSelectedOptions.length) {
              // User clicked an individual option while "all" was selected
              // Switch to showing all individual options as selected
              const data = slimSelect.store.getData();
              const allValues = getAllOptionValues(data);

              // Update data to mark all individual options as selected and "all" as not selected
              for (const item of data) {
                if (!("value" in item)) continue;
                if (item.value === "all") {
                  item.selected = false;
                } else if (allValues.includes(item.value)) {
                  item.selected = true;
                }
              }

              // Defer rendering to next tick to ensure proper UI updates
              setTimeout(() => {
                if (!slimSelect) return;
                slimSelect.store.setData(data);
                slimSelect.render.renderValues();
                slimSelect.render.renderOptions(data);
              }, 0);

              // No onChange needed - value hasn't changed, just visual representation
              return false;
            } else if (selectedOptions.length < oldSelectedOptions.length) {
              // User deselected items while "all" was selected -> remove "all"
              const newSelection = selectedOptions
                .filter((o) => o.value !== "all")
                .map((o) => o.value);

              // Update data based on new selection
              const data = slimSelect.store.getData();
              for (const item of data) {
                if (!("value" in item)) continue;
                item.selected = newSelection.includes(item.value);
              }

              // Defer rendering to next tick to ensure proper UI updates
              setTimeout(() => {
                if (!slimSelect) return;
                slimSelect.store.setData(data);
                slimSelect.render.renderValues();
                slimSelect.render.renderOptions(data);
              }, 0);

              // Manually trigger onChange
              if (
                props.onChange &&
                JSON.stringify([...newSelection].sort()) !==
                  JSON.stringify(
                    [
                      ...(Array.isArray(currentValue) ? currentValue : []),
                    ].sort(),
                  )
              ) {
                props.onChange(newSelection);
                currentValue = newSelection;
              }

              return false;
            }
          } else {
            if (includedAllBefore) {
              // User deselected "all" -> clear everything
              const data = slimSelect.store.getData();
              for (const item of data) {
                if (!("value" in item)) continue;
                item.selected = false;
              }

              // Defer rendering to next tick to ensure proper UI updates
              setTimeout(() => {
                if (!slimSelect) return;
                slimSelect.store.setData(data);
                slimSelect.render.renderValues();
                slimSelect.render.renderOptions(data);
              }, 0);

              // Manually trigger onChange
              if (
                props.onChange &&
                (Array.isArray(currentValue)
                  ? currentValue.length > 0
                  : currentValue !== "")
              ) {
                props.onChange([]);
                currentValue = [];
              }

              return false;
            }
          }
        }

        return true; // Allow default behavior
      },
      afterChange: (newVal) => {
        if (!slimSelect) return;

        let newValue = props.multiple
          ? newVal.map((o) => o.value)
          : (newVal[0]?.value ?? "");

        // Handle "all" option
        if (props.addAllOption && Array.isArray(newValue)) {
          const hasOnlyAll = newValue.length === 1 && newValue[0] === "all";

          if (hasOnlyAll) {
            // If only "all" is selected, get all individual values
            const data = slimSelect.store.getData();
            const allValues = getAllOptionValues(data);
            newValue = allValues;
          } else {
            // Otherwise just filter out "all" from the array
            newValue = newValue.filter((v) => v !== "all");
          }
        }

        const slimData = slimSelect.store.getData();
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
      slimSelect.store.setData(getDataWithAll(data));

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
