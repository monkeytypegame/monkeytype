import SlimSelectCore, { Config } from "slim-select";
import { Optgroup, Option } from "slim-select/store";
import {
  onMount,
  onCleanup,
  createEffect,
  createSignal,
  createMemo,
} from "solid-js";
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

  // Compute if all options are selected
  const allAreSelected = createMemo(() => {
    if (!props.addAllOption || !props.multiple || !props.data) return false;

    const allValues = getAllOptionValues(props.data);
    const currentValues = Array.isArray(props.value) ? props.value : [];

    if (allValues.length === 0) return false;

    return allValues.every((v) => currentValues.includes(v));
  });

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
      selected: allAreSelected(),
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
              const data = slimSelect.getData();
              const allValues = getAllOptionValues(data);
              slimSelect.setSelected(allValues, false);

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
            } else if (selectedOptions.length < oldSelectedOptions.length) {
              // User deselected items while "all" was selected -> remove "all"
              const newSelection = selectedOptions
                .filter((o) => o.value !== "all")
                .map((o) => o.value);
              slimSelect.setSelected(newSelection, false);

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
              slimSelect.setSelected([], false);

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

          // Check if all individual options are now selected
          const data = slimSelect.getData();
          const allValues = getAllOptionValues(data);
          const newValuesSet = new Set(selectedOptions.map((o) => o.value));

          if (
            allValues.length > 0 &&
            allValues.every((v) => newValuesSet.has(v))
          ) {
            // Auto-select "all" for display, but keep individual values
            // Let default behavior happen, will be filtered in afterChange
          }
        }

        return true; // Allow default behavior
      },
      afterChange: (newVal) => {
        if (!slimSelect) return;

        let newValue = props.multiple
          ? newVal.map((o) => o.value)
          : (newVal[0]?.value ?? "");

        // Filter out "all" from the value array for onChange
        if (props.addAllOption && Array.isArray(newValue)) {
          newValue = newValue.filter((v) => v !== "all");
        }

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
      slimSelect.setData(getDataWithAll(data));

      if (props.value !== undefined) {
        syncValueToSlimSelect(props.value, false);
      }
    }
  });

  // Update "all" selected state when value changes
  createEffect(() => {
    if (
      !props.addAllOption ||
      !props.multiple ||
      !slimSelect ||
      isInitialMount()
    ) {
      return;
    }

    const isAllSelected = allAreSelected();
    const data = slimSelect.getData();
    const allOption = data.find(
      (item) => "value" in item && item.value === "all",
    );

    if (
      allOption &&
      "selected" in allOption &&
      allOption.selected !== isAllSelected
    ) {
      // Update the "all" option's selected state
      const updatedData = data.map((item) => {
        if ("value" in item && item.value === "all") {
          return Object.assign({}, item, { selected: isAllSelected });
        }
        return item;
      });
      slimSelect.setData(updatedData);
    }
  });

  return (
    <select ref={(el) => (selectRef = el)} multiple={props.multiple}>
      {props.children}
    </select>
  );
}
