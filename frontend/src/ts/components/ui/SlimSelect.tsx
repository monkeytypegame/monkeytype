import SlimSelectCore, { Config } from "slim-select";
import { Optgroup, Option } from "slim-select/store";
import { onMount, onCleanup, createEffect, createSignal } from "solid-js";
import type { JSX, JSXElement } from "solid-js";

let globalActiveSlimSelectId: number | undefined;
let globalUserChangeTimeoutId: number | undefined;
let nextSlimSelectId = 0;

export type SlimSelectProps = {
  options?: Pick<Option, "value" | "text">[];
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

  const [isInitialMount, setIsInitialMount] = createSignal(true);
  const [isInitializing, setIsInitializing] = createSignal(true);
  let currentSelected: string[] = props.selected ?? [];
  const instanceId = nextSlimSelectId++;
  let lastOptionsReference: typeof props.options | undefined = undefined;

  const buildData = (
    options: Pick<Option, "value" | "text">[] = [],
    selected: string[] = [],
  ): Partial<Option>[] => {
    return options.map((option) => ({
      ...option,
      selected: selected.includes(option.value),
    }));
  };

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

  const renderAllState = (
    data: (Partial<Option> | Partial<Optgroup>)[],
  ): void => {
    if (!slimSelect) return;

    const allValues = getAllOptionValues(data);
    for (const item of data) {
      if (!("value" in item)) continue;
      item.selected = item.value === "all";
    }
    //@ts-expect-error todo
    slimSelect.store.setData(data);
    slimSelect.render.renderValues();

    for (const item of data) {
      if (!("value" in item)) continue;
      const isAllOrIncluded =
        item.value === "all" ||
        (typeof item.value === "string" && allValues.includes(item.value));
      item.selected = isAllOrIncluded;
    }
    setTimeout(() => {
      if (!slimSelect) return;
      //@ts-expect-error todo
      slimSelect.store.setData(data);
      //@ts-expect-error todo
      slimSelect.render.renderOptions(data);
    }, 0);
  };

  const handleAllSelection = (
    selectedOptions: Option[],
    oldSelectedOptions: Option[],
  ): boolean | void => {
    if (!props.addAllOption || !props.multiple || !slimSelect) return;

    const includesAllNow = selectedOptions.some((o) => o.value === "all");
    const includedAllBefore = oldSelectedOptions.some((o) => o.value === "all");

    if (!includesAllNow && !includedAllBefore) return;

    const data = slimSelect.store.getData();
    const allValues = getAllOptionValues(data);

    if (includesAllNow && !includedAllBefore) {
      // User clicked "all"
      renderAllState(data);
      if (
        props.onChange &&
        JSON.stringify([...allValues].sort()) !==
          JSON.stringify([...currentSelected].sort())
      ) {
        props.onChange(allValues);
        currentSelected = allValues;
      }
      return false;
    }

    if (includesAllNow && selectedOptions.length > oldSelectedOptions.length) {
      // Clicked item while "all" selected - switch to individual display
      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = item.value !== "all" && allValues.includes(item.value);
      }
      setTimeout(() => {
        if (!slimSelect) return;
        slimSelect.store.setData(data);
        slimSelect.render.renderValues();
        slimSelect.render.renderOptions(data);
      }, 0);
      return false;
    }

    if (includesAllNow && selectedOptions.length < oldSelectedOptions.length) {
      // Deselected items while "all" selected
      const newSelection = selectedOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value);

      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = newSelection.includes(item.value);
      }
      setTimeout(() => {
        if (!slimSelect) return;
        slimSelect.store.setData(data);
        slimSelect.render.renderValues();
        slimSelect.render.renderOptions(data);
      }, 0);

      if (
        props.onChange &&
        JSON.stringify([...newSelection].sort()) !==
          JSON.stringify([...currentSelected].sort())
      ) {
        props.onChange(newSelection);
        currentSelected = newSelection;
      }
      return false;
    }

    if (!includesAllNow && includedAllBefore) {
      // User deselected "all"
      for (const item of data) {
        if (!("value" in item)) continue;
        item.selected = false;
      }
      setTimeout(() => {
        if (!slimSelect) return;
        slimSelect.store.setData(data);
        slimSelect.render.renderValues();
        slimSelect.render.renderOptions(data);
      }, 0);

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
      //@ts-expect-error todo
      data: getDataWithAll(buildData(props.options, props.selected)),
      ...(props.settings && { settings: props.settings }),
      ...(props.cssClasses && { cssClasses: props.cssClasses }),
      events: {
        ...props.events,
        beforeChange: (selectedOptions, oldSelectedOptions) => {
          globalActiveSlimSelectId = instanceId;

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

          const valueChanged =
            JSON.stringify([...newValue].sort()) !==
            JSON.stringify([...currentSelected].sort());

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

          if (globalUserChangeTimeoutId !== undefined) {
            clearTimeout(globalUserChangeTimeoutId);
          }

          globalUserChangeTimeoutId = setTimeout(() => {
            requestAnimationFrame(() => {
              globalActiveSlimSelectId = undefined;
              globalUserChangeTimeoutId = undefined;
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

    setTimeout(() => {
      if (!props.onChange || !props.options || !slimSelect) {
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

      setTimeout(() => setIsInitializing(false), 0);
    }, 0);
  });

  onCleanup(() => {
    slimSelect?.destroy();
    slimSelect = null;
    props.ref?.(null);
  });

  createEffect(() => {
    const selected = props.selected;

    if (isInitialMount()) {
      currentSelected = selected ?? [];
      return;
    }

    if (slimSelect && selected !== undefined) {
      currentSelected = selected;

      if (props.addAllOption && props.multiple && props.options) {
        const allAreSelected =
          props.options.length > 0 &&
          selected.length === props.options.length &&
          props.options.every((opt) => selected.includes(opt.value));

        if (allAreSelected) {
          const storeData = slimSelect.store.getData();
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected = item.value === "all";
          }
          slimSelect.store.setData(storeData);
          slimSelect.render.renderValues();

          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected =
              item.value === "all" ||
              props.options.some((opt) => opt.value === item.value);
          }
          setTimeout(() => {
            if (!slimSelect) return;
            slimSelect.store.setData(storeData);
            slimSelect.render.renderOptions(storeData);
          }, 0);
          return;
        }
      }

      syncSelectedToSlimSelect(selected, false);
    }
  });

  createEffect(() => {
    const options = props.options;
    const selected = props.selected;

    if (!isInitialMount() && slimSelect && options) {
      if (options === lastOptionsReference) return;
      if (isInitializing()) return;
      if (globalActiveSlimSelectId !== undefined) return;

      const data = buildData(options, selected ?? []);
      //@ts-expect-error todo
      slimSelect.store.setData(getDataWithAll(data));

      if (props.addAllOption && props.multiple) {
        const storeData = slimSelect.store.getData();
        const allPossibleValues = getAllOptionValues(storeData);
        const allAreSelected =
          allPossibleValues.length > 0 &&
          (selected?.length ?? 0) === allPossibleValues.length;

        if (allAreSelected) {
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected = item.value === "all";
          }
          slimSelect.store.setData(storeData);
          slimSelect.render.renderValues();

          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected =
              item.value === "all" || allPossibleValues.includes(item.value);
          }
          setTimeout(() => {
            if (!slimSelect) return;
            slimSelect.store.setData(storeData);
            slimSelect.render.renderOptions(storeData);
            lastOptionsReference = options;
          }, 0);
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
