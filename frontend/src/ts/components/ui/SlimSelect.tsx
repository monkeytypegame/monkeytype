import SlimSelectCore, { Config } from "slim-select";
import { Optgroup, Option } from "slim-select/store";
import { onMount, onCleanup, createEffect, createSignal } from "solid-js";
import type { JSX, JSXElement } from "solid-js";

// Helper: Check if two arrays have the same elements (unordered)
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((item) => setA.has(item));
}

// Helper: Update SlimSelect data and trigger renders
function updateSlimSelectData(
  slimSelect: SlimSelectCore,
  data: (Partial<Option> | Partial<Optgroup>)[],
  scheduleRender = false,
): void {
  slimSelect.store.setData(data as Option[]);
  if (scheduleRender) {
    requestAnimationFrame(() => {
      slimSelect.render.renderValues();
      slimSelect.render.renderOptions(data as Option[]);
    });
  }
}

export type SlimSelectProps = {
  options?: Pick<Option, "value" | "text">[];
  values?: string[]; // Simple string array where value === text
  selected?: string[];
  settings?: Config["settings"] & { scrollToTop?: boolean };
  events?: Config["events"];
  cssClasses?: Config["cssClasses"];
  onChange?: (selected: string[]) => void;
  children?: JSX.Element;
  multiple?: boolean;
  addAllOption?: boolean;
  ref?: (instance: SlimSelectCore | null) => void;
};

export default function SlimSelect(props: SlimSelectProps): JSXElement {
  let selectRef!: HTMLSelectElement;
  let slimSelect: SlimSelectCore | null = null;

  // State tracking
  const [isInitialMount, setIsInitialMount] = createSignal(true);
  const [isInitializing, setIsInitializing] = createSignal(true);
  let currentSelected: string[] = props.selected ?? [];
  let lastOptionsReference: typeof props.options | undefined = undefined;

  // Instance-scoped state to replace globals
  let isActiveInstance = false;
  let userChangeTimeoutId: number | undefined;

  // Derive options from either 'options' or 'values' prop
  const getOptions = (): Pick<Option, "value" | "text">[] => {
    if (props.options) return props.options;
    if (props.values) {
      return props.values.map((v) => ({ value: v, text: v }));
    }
    return [];
  };

  // Build option data with selection state
  const buildData = (
    options: Pick<Option, "value" | "text">[] = [],
    selected: string[] = [],
  ): Partial<Option>[] => {
    const selectedSet = new Set(selected);
    return options.map((option) => ({
      ...option,
      selected: selectedSet.has(option.value),
    }));
  };

  // Extract all non-special option values from data
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

  // Prepend "all" option if configured
  const getDataWithAll = (data: Partial<Option>[]): Partial<Option>[] => {
    if (!props.addAllOption || !props.multiple) return data;
    return [{ value: "all", text: "all", selected: false }, ...data];
  };

  const syncSelectedToSlimSelect = (
    selected: string[],
    runAfterChange = false,
  ): void => {
    if (!slimSelect) return;
    slimSelect.setSelected(selected ?? [], runAfterChange);
  };

  // Render "all" selected state (shows "all" but all items are actually selected)
  const renderAllState = (
    data: (Partial<Option> | Partial<Optgroup>)[],
  ): void => {
    if (!slimSelect) return;

    const allValues = getAllOptionValues(data);
    const allValuesSet = new Set(allValues);

    // First pass: show only "all" in the display
    for (const item of data) {
      if (!("value" in item)) continue;
      item.selected = item.value === "all";
    }
    slimSelect.store.setData(data as Option[]);
    slimSelect.render.renderValues();

    // Second pass: mark all items as selected in the data
    for (const item of data) {
      if (!("value" in item)) continue;
      const isAllOrIncluded =
        item.value === "all" ||
        (typeof item.value === "string" && allValuesSet.has(item.value));
      item.selected = isAllOrIncluded;
    }

    requestAnimationFrame(() => {
      if (!slimSelect) return;
      slimSelect.store.setData(data as Option[]);
      slimSelect.render.renderOptions(data as Option[]);
    });
  };

  // Handle "all" option selection logic
  const handleAllSelection = (
    selectedOptions: Option[],
    oldSelectedOptions: Option[],
  ): boolean | void => {
    if (!props.addAllOption || !props.multiple || !slimSelect) return;

    const includesAllNow = selectedOptions.some((o) => o.value === "all");
    const includedAllBefore = oldSelectedOptions.some((o) => o.value === "all");

    // No "all" option involvement, skip special handling
    if (!includesAllNow && !includedAllBefore) return;

    const data = slimSelect.store.getData();
    const allValues = getAllOptionValues(data);
    const allValuesSet = new Set(allValues);

    // Case 1: User clicked "all" option
    if (includesAllNow && !includedAllBefore) {
      renderAllState(data);
      if (props.onChange && !arraysEqual(allValues, currentSelected)) {
        props.onChange(allValues);
        currentSelected = allValues;
      }
      return false;
    }

    // Case 2: User clicked individual item while "all" is selected
    if (includesAllNow && selectedOptions.length > oldSelectedOptions.length) {
      // Switch from "all" display to showing individual selections
      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = item.value !== "all" && allValuesSet.has(item.value);
      }
      requestAnimationFrame(() => {
        if (!slimSelect) return;
        updateSlimSelectData(slimSelect, data, false);
        slimSelect.render.renderValues();
        slimSelect.render.renderOptions(data as Option[]);
      });
      return false;
    }

    // Case 3: User deselected items while "all" was selected
    if (includesAllNow && selectedOptions.length < oldSelectedOptions.length) {
      const newSelection = selectedOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value);
      const newSelectionSet = new Set(newSelection);

      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = newSelectionSet.has(item.value);
      }
      requestAnimationFrame(() => {
        if (!slimSelect) return;
        updateSlimSelectData(slimSelect, data, false);
        slimSelect.render.renderValues();
        slimSelect.render.renderOptions(data as Option[]);
      });

      if (props.onChange && !arraysEqual(newSelection, currentSelected)) {
        props.onChange(newSelection);
        currentSelected = newSelection;
      }
      return false;
    }

    // Case 4: User deselected "all" option
    if (!includesAllNow && includedAllBefore) {
      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = false;
      }
      requestAnimationFrame(() => {
        if (!slimSelect) return;
        updateSlimSelectData(slimSelect, data, false);
        slimSelect.render.renderValues();
        slimSelect.render.renderOptions(data as Option[]);
      });

      if (props.onChange && currentSelected.length > 0) {
        props.onChange([]);
        currentSelected = [];
      }
      return false;
    }
  };

  onMount(() => {
    const ogAfterChange = props.events?.afterChange;
    const ogBeforeChange = props.events?.beforeChange;
    const ogBeforeOpen = props.events?.beforeOpen;

    const config: Config = {
      select: selectRef,
      data: getDataWithAll(buildData(getOptions(), props.selected)) as Option[],
      ...(props.settings && { settings: props.settings }),
      ...(props.cssClasses && { cssClasses: props.cssClasses }),
      events: {
        ...props.events,
        beforeChange: (selectedOptions, oldSelectedOptions) => {
          isActiveInstance = true;

          if (ogBeforeChange?.(selectedOptions, oldSelectedOptions) === false) {
            return false;
          }

          const result = handleAllSelection(
            selectedOptions,
            oldSelectedOptions,
          );
          if (result !== undefined) return result;

          return true;
        },
        afterChange: (newVal) => {
          if (!slimSelect) return;

          let newValue = newVal.map((o) => o.value);

          if (props.addAllOption && Array.isArray(newValue)) {
            if (newValue.length === 1 && newValue[0] === "all") {
              newValue = getAllOptionValues(slimSelect.store.getData());
            } else {
              newValue = newValue.filter((v) => v !== "all");
            }
          }

          const slimData = slimSelect.store.getData();
          const options = slimData.flatMap((item) =>
            "label" in item ? item.options : [item],
          );

          const valueChanged = !arraysEqual(newValue, currentSelected);

          const currentValueExists =
            currentSelected.length > 0 &&
            currentSelected.every((v) => options.some((o) => o.value === v));

          const newValueIsValid =
            newValue.length > 0 &&
            newValue.every((v) => options.some((o) => o.value === v));

          if (
            props.onChange &&
            valueChanged &&
            (currentValueExists || newValueIsValid)
          ) {
            props.onChange(newValue);
            currentSelected = newValue;
          }

          ogAfterChange?.(newVal);

          // Clear active instance flag with debounce
          if (userChangeTimeoutId !== undefined) {
            clearTimeout(userChangeTimeoutId);
          }

          userChangeTimeoutId = setTimeout(() => {
            requestAnimationFrame(() => {
              isActiveInstance = false;
              userChangeTimeoutId = undefined;
            });
          }, 150) as unknown as number;
        },
        beforeOpen: () => {
          if (!slimSelect) return;

          if (props.settings?.scrollToTop) {
            const listElement = slimSelect.render.content.list;
            const topListItem = listElement.children.item(0) as HTMLElement;
            listElement.scrollTop =
              topListItem.offsetTop - listElement.offsetTop;
          }
          ogBeforeOpen?.();
        },
      },
    };

    slimSelect = new SlimSelectCore(config);
    lastOptionsReference = props.options;
    props.ref?.(slimSelect);

    if (props.selected !== undefined) {
      syncSelectedToSlimSelect(props.selected, false);
    }

    setIsInitialMount(false);

    // Initialize with selected values
    requestAnimationFrame(() => {
      if (!props.onChange || (!props.options && !props.values) || !slimSelect) {
        setIsInitializing(false);
        return;
      }

      const initialData = slimSelect.store.getData();
      const selectedOptions = initialData
        .flatMap((item) => ("label" in item ? item.options : [item]))
        .filter((item) => item.selected);

      if (selectedOptions.length > 0) {
        let initialValue = selectedOptions.map((o) => o.value);

        if (props.addAllOption) {
          if (initialValue.length === 1 && initialValue[0] === "all") {
            initialValue = getAllOptionValues(initialData);
          } else {
            initialValue = initialValue.filter((v) => v !== "all");
          }
        }

        props.onChange(initialValue);
        currentSelected = initialValue;
      }

      requestAnimationFrame(() => setIsInitializing(false));
    });
  });

  onCleanup(() => {
    slimSelect?.destroy();
    slimSelect = null;
    props.ref?.(null);
  });

  // Effect: Sync external selected prop changes to SlimSelect
  createEffect(() => {
    const selected = props.selected;

    if (isInitialMount()) {
      currentSelected = selected ?? [];
      return;
    }

    if (slimSelect && selected !== undefined) {
      currentSelected = selected;

      // Handle "all" selection rendering
      if (props.addAllOption && props.multiple) {
        const options = getOptions();
        const selectedSet = new Set(selected);
        const allAreSelected =
          options.length > 0 &&
          selected.length === options.length &&
          options.every((opt) => selectedSet.has(opt.value));

        if (allAreSelected) {
          const storeData = slimSelect.store.getData();
          const optionValuesSet = new Set(options.map((opt) => opt.value));

          // First pass: show only "all"
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected = item.value === "all";
          }
          slimSelect.store.setData(storeData as Option[]);
          slimSelect.render.renderValues();

          // Second pass: mark all items selected
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected =
              item.value === "all" || optionValuesSet.has(item.value);
          }
          requestAnimationFrame(() => {
            if (!slimSelect) return;
            slimSelect.store.setData(storeData as Option[]);
            slimSelect.render.renderOptions(storeData as Option[]);
          });
          return;
        }
      }

      syncSelectedToSlimSelect(selected, false);
    }
  });

  // Effect: Handle options prop changes
  createEffect(() => {
    const options = getOptions();
    const selected = props.selected;

    if (!isInitialMount() && slimSelect && options.length > 0) {
      // Skip if options haven't changed or we're still initializing or user is actively changing
      if (options === lastOptionsReference) return;
      if (isInitializing()) return;
      if (isActiveInstance) return;

      const data = buildData(options, selected ?? []);
      slimSelect.store.setData(getDataWithAll(data) as Option[]);

      // Handle "all" option when all items are selected
      if (props.addAllOption && props.multiple) {
        const storeData = slimSelect.store.getData();
        const allPossibleValues = getAllOptionValues(storeData);
        const allAreSelected =
          allPossibleValues.length > 0 &&
          (selected?.length ?? 0) === allPossibleValues.length;

        if (allAreSelected) {
          const optionValuesSet = new Set(allPossibleValues);
          // First pass: show only "all"
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected = item.value === "all";
          }
          slimSelect.store.setData(storeData as Option[]);
          slimSelect.render.renderValues();

          // Second pass: mark all items selected
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected =
              item.value === "all" || optionValuesSet.has(item.value);
          }
          requestAnimationFrame(() => {
            if (!slimSelect) return;
            slimSelect.store.setData(storeData as Option[]);
            slimSelect.render.renderOptions(storeData as Option[]);
            lastOptionsReference = options;
          });
          return;
        }
      }

      slimSelect.render.renderValues();
      slimSelect.render.renderOptions(slimSelect.store.getData());
      lastOptionsReference = options;

      if (props.selected !== undefined) {
        syncSelectedToSlimSelect(props.selected, false);
      }
    }
  });

  return (
    <select ref={(el) => (selectRef = el)} multiple={props.multiple}>
      {props.children}
    </select>
  );
}
