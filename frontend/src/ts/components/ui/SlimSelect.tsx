import SlimSelectCore, { Config } from "slim-select";
import { Optgroup, Option } from "slim-select/store";
import { onMount, onCleanup, createEffect, createSignal } from "solid-js";
import type { JSX, JSXElement } from "solid-js";

// Global flag to prevent all SlimSelects from receiving data updates during any user interaction
let globalActiveSlimSelectId: number | undefined;
let globalUserChangeTimeoutId: number | undefined;
let nextSlimSelectId = 0;

export type SlimSelectProps = {
  values?: string[];
  selected?: string[];
  settings?: Config["settings"] & { scrollToTop?: boolean };
  events?: Config["events"];
  cssClasses?: Config["cssClasses"];
  onChange?: (selected: string[]) => void;
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
  const [isInitializing, setIsInitializing] = createSignal(true);
  let currentSelected: string[] = props.selected ?? [];
  const instanceId = nextSlimSelectId++;
  let lastValuesReference: typeof props.values | undefined = undefined;

  // Convert values + selected into data format for slim-select
  const buildData = (
    values: string[] = [],
    selected: string[] = [],
  ): Partial<Option>[] => {
    return values.map((value) => ({
      value,
      text: value,
      selected: selected.includes(value),
    }));
  };

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

  // Inject "all" option if needed
  const getDataWithAll = (data: Partial<Option>[]): Partial<Option>[] => {
    if (!props.addAllOption || !props.multiple) return data;

    const allOption: Partial<Option> = {
      value: "all",
      text: "all",
      selected: false,
    };

    return [allOption, ...data];
  };

  const getCleanValue = (val: string[]): string[] => {
    return val ?? [];
  };

  const syncSelectedToSlimSelect = (
    selected: string[],
    runAfterChange = false,
  ): void => {
    if (!slimSelect) return;

    const cleanValue = getCleanValue(selected);
    slimSelect.setSelected(cleanValue, runAfterChange);
  };

  onMount(() => {
    const config: Config = {
      select: selectRef,
    };

    const initialData = buildData(props.values, props.selected);
    //@ts-expect-error todo
    config.data = getDataWithAll(initialData);
    if (props.settings) config.settings = props.settings;
    if (props.cssClasses) config.cssClasses = props.cssClasses;

    const ogAfterChange = props.events?.afterChange;
    const ogBeforeChange = props.events?.beforeChange;
    const ogBeforeOpen = props.events?.beforeOpen;

    config.events = {
      ...props.events,
      beforeChange: (selectedOptions, oldSelectedOptions) => {
        console.log(
          "[SlimSelect beforeChange] ENTRY",
          JSON.stringify(
            {
              instanceId,
              selected: selectedOptions.map((o) => o.value),
              selectedDetailed: selectedOptions.map((o) => ({
                value: o.value,
                selected: o.selected,
              })),
              old: oldSelectedOptions.map((o) => o.value),
              oldDetailed: oldSelectedOptions.map((o) => ({
                value: o.value,
                selected: o.selected,
              })),
              addAllOption: props.addAllOption,
              multiple: props.multiple,
              currentSelected,
              globalActiveSlimSelectIdBefore: globalActiveSlimSelectId,
            },
            null,
            2,
          ),
        );
        globalActiveSlimSelectId = instanceId;
        console.log(
          "[SlimSelect beforeChange] Set globalActiveSlimSelectId to",
          instanceId,
        );

        // Call original beforeChange if it exists
        const ogResult = ogBeforeChange?.(selectedOptions, oldSelectedOptions);
        if (ogResult === false) {
          console.log("[SlimSelect] Original beforeChange returned false");
          return false;
        }

        // Handle "all" option logic if enabled
        if (props.addAllOption && props.multiple && slimSelect) {
          const includesAllNow = selectedOptions.some((o) => o.value === "all");
          const includedAllBefore = oldSelectedOptions.some(
            (o) => o.value === "all",
          );

          console.log(
            "[SlimSelect] All option state:",
            JSON.stringify(
              {
                includesAllNow,
                includedAllBefore,
                selectedLength: selectedOptions.length,
                oldLength: oldSelectedOptions.length,
                lengthDiff: selectedOptions.length - oldSelectedOptions.length,
              },
              null,
              2,
            ),
          );

          // Check if this is a normal select/deselect (no "all" involved)
          if (!includesAllNow && !includedAllBefore) {
            console.log(
              "[SlimSelect] Normal selection (no 'all' involved), allowing default",
            );
            // Log the current data state for debugging
            const currentData = slimSelect.store.getData();
            const selectedInData = currentData
              .filter((item) => "value" in item && item.selected)
              .map((item) => ("value" in item ? item.value : null));
            console.log(
              "[SlimSelect] Current data selected state:",
              selectedInData,
            );
          }

          if (includesAllNow) {
            if (!includedAllBefore) {
              console.log("[SlimSelect] BRANCH: User clicked 'all'");
              // User clicked "all" -> select all non-"all" options
              const data = slimSelect.store.getData();
              const allValues = getAllOptionValues(data);
              console.log("[SlimSelect] All values:", allValues);

              // First update: mark only "all" as selected for the select box display
              for (const item of data) {
                if (!("value" in item)) continue;
                item.selected = item.value === "all";
              }
              slimSelect.store.setData(data);
              slimSelect.render.renderValues();
              console.log(
                "[SlimSelect] Phase 1: Set 'all' only for renderValues",
              );

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
                console.log(
                  "[SlimSelect] Phase 2: Rendered all options in dropdown",
                );
              }, 0);

              // Manually trigger onChange
              if (
                props.onChange &&
                JSON.stringify([...allValues].sort()) !==
                  JSON.stringify([...currentSelected].sort())
              ) {
                console.log("[SlimSelect] Calling onChange with all values");
                props.onChange(allValues);
                currentSelected = allValues;
              } else {
                console.log(
                  "[SlimSelect] Skipped onChange (no change or no handler)",
                );
              }

              console.log("[SlimSelect] Returning false to prevent default");
              return false; // Prevent default behavior
            } else if (selectedOptions.length > oldSelectedOptions.length) {
              console.log(
                "[SlimSelect] BRANCH: User clicked individual option while 'all' selected",
              );
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
                console.log(
                  "[SlimSelect] Switched from 'all' to individual options display",
                );
              }, 0);

              console.log(
                "[SlimSelect] Returning false (no onChange, just visual)",
              );
              // No onChange needed - value hasn't changed, just visual representation
              return false;
            } else if (selectedOptions.length < oldSelectedOptions.length) {
              console.log(
                "[SlimSelect] BRANCH: User deselected items while 'all' selected",
              );
              // User deselected items while "all" was selected -> remove "all"
              const newSelection = selectedOptions
                .filter((o) => o.value !== "all")
                .map((o) => o.value);

              console.log(
                "[SlimSelect] New selection after deselect:",
                newSelection,
              );

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
                console.log("[SlimSelect] Updated UI after deselection");
              }, 0);

              // Manually trigger onChange
              if (
                props.onChange &&
                JSON.stringify([...newSelection].sort()) !==
                  JSON.stringify([...currentSelected].sort())
              ) {
                console.log("[SlimSelect] Calling onChange with new selection");
                props.onChange(newSelection);
                currentSelected = newSelection;
              } else {
                console.log(
                  "[SlimSelect] Skipped onChange (no change or no handler)",
                );
              }

              console.log("[SlimSelect] Returning false to prevent default");
              return false;
            }
          } else {
            if (includedAllBefore) {
              console.log("[SlimSelect] BRANCH: User deselected 'all'");
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
                console.log("[SlimSelect] Cleared all selections");
              }, 0);

              // Manually trigger onChange
              if (props.onChange && currentSelected.length > 0) {
                console.log("[SlimSelect] Calling onChange with empty array");
                props.onChange([]);
                currentSelected = [];
              } else {
                console.log(
                  "[SlimSelect] Skipped onChange (already empty or no handler)",
                );
              }

              console.log("[SlimSelect] Returning false to prevent default");
              return false;
            }
          }
        }

        console.log("[SlimSelect] Returning true (allow default behavior)");
        return true; // Allow default behavior
      },
      afterChange: (newVal) => {
        console.log(
          "[SlimSelect afterChange] Entry:",
          JSON.stringify(
            {
              instanceId,
              newVal: newVal.map((o) => o.value),
              currentSelected,
              addAllOption: props.addAllOption,
              globalActiveSlimSelectId,
            },
            null,
            2,
          ),
        );

        if (!slimSelect) return;

        let newValue = newVal.map((o) => o.value);

        console.log("[SlimSelect afterChange] Initial newValue:", newValue);

        // Handle "all" option
        if (props.addAllOption && Array.isArray(newValue)) {
          const hasOnlyAll = newValue.length === 1 && newValue[0] === "all";

          console.log("[SlimSelect afterChange] hasOnlyAll:", hasOnlyAll);

          if (hasOnlyAll) {
            // If only "all" is selected, get all individual values
            const data = slimSelect.store.getData();
            const allValues = getAllOptionValues(data);
            console.log(
              "[SlimSelect afterChange] Converting 'all' to:",
              allValues,
            );
            newValue = allValues;
          } else {
            // Otherwise just filter out "all" from the array
            const beforeFilter = newValue;
            newValue = newValue.filter((v) => v !== "all");
            console.log(
              "[SlimSelect afterChange] Filtered 'all' from:",
              beforeFilter,
              "to:",
              newValue,
            );
          }
        }

        const slimData = slimSelect.store.getData();
        const options = slimData.flatMap((item) =>
          "label" in item ? item.options : [item],
        );

        const currentValueExists =
          currentSelected.length > 0 &&
          currentSelected.every((v) => options.some((o) => o.value === v));

        const newValueIsValid =
          newValue.length > 0 &&
          newValue.every((v) => options.some((o) => o.value === v));

        const valueChanged =
          JSON.stringify([...newValue].sort()) !==
          JSON.stringify([...currentSelected].sort());

        console.log(
          "[SlimSelect afterChange] Validation:",
          JSON.stringify(
            {
              currentValueExists,
              newValueIsValid,
              valueChanged,
              currentSelected,
              newValue,
            },
            null,
            2,
          ),
        );

        if (
          props.onChange &&
          valueChanged &&
          (currentValueExists || newValueIsValid)
        ) {
          console.log(
            "[SlimSelect afterChange] Calling onChange with:",
            newValue,
          );
          props.onChange(newValue);
          currentSelected = newValue;
        } else {
          console.log(
            "[SlimSelect afterChange] Skipped onChange:",
            JSON.stringify(
              {
                hasOnChange: !!props.onChange,
                valueChanged,
                currentValueExists,
                newValueIsValid,
                currentSelected,
                newValue,
              },
              null,
              2,
            ),
          );
        }

        ogAfterChange?.(newVal);

        // Clear any pending timeout
        if (globalUserChangeTimeoutId !== undefined) {
          clearTimeout(globalUserChangeTimeoutId);
        }

        // Defer clearing the flag to allow all reactive updates to complete
        // Using requestAnimationFrame to wait for next frame after all updates settle
        globalUserChangeTimeoutId = setTimeout(() => {
          requestAnimationFrame(() => {
            globalActiveSlimSelectId = undefined;
            globalUserChangeTimeoutId = undefined;
            console.log(
              "[SlimSelect afterChange] Cleared globalActiveSlimSelectId",
            );
          });
        }, 150) as unknown as number;
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

    // Store initial values reference
    lastValuesReference = props.values;

    // expose instance
    props.ref?.(slimSelect);

    if (props.selected !== undefined) {
      syncSelectedToSlimSelect(props.selected, false);
    }

    console.log(
      "[SlimSelect onMount] Setting isInitialMount to false",
      JSON.stringify({ instanceId, currentSelected }, null, 2),
    );
    setIsInitialMount(false);

    // Defer onChange call until after all effects settle to avoid race condition
    setTimeout(() => {
      console.log(
        "[SlimSelect onMount setTimeout] Starting",
        JSON.stringify(
          {
            instanceId,
            hasOnChange: !!props.onChange,
            hasValues: !!props.values,
            hasSlimSelect: !!slimSelect,
            currentSelected,
          },
          null,
          2,
        ),
      );

      if (!props.onChange || !props.values || !slimSelect) {
        setIsInitializing(false);
        console.log(
          "[SlimSelect onMount setTimeout] No onChange/values/slimSelect, set isInitializing=false",
        );
        return;
      }

      const initialData = slimSelect.store.getData();
      const selectedOptions = initialData
        .flatMap((item) => ("label" in item ? item.options : [item]))
        .filter((item) => item.selected);

      console.log(
        "[SlimSelect onMount setTimeout] Found selected options:",
        JSON.stringify(
          {
            instanceId,
            selectedCount: selectedOptions.length,
            selectedValues: selectedOptions.map((o) => o.value),
          },
          null,
          2,
        ),
      );

      if (selectedOptions.length > 0) {
        let initialValue = selectedOptions.map((o) => o.value);

        // Handle "all" option
        if (props.addAllOption) {
          const hasOnlyAll =
            initialValue.length === 1 && initialValue[0] === "all";
          if (hasOnlyAll) {
            const allValues = getAllOptionValues(initialData);
            initialValue = allValues;
          } else {
            initialValue = initialValue.filter((v) => v !== "all");
          }
        }

        console.log(
          "[SlimSelect onMount] Calling onChange with initial values:",
          JSON.stringify(
            {
              instanceId,
              initialValue,
              currentValueBefore: currentSelected,
            },
            null,
            2,
          ),
        );
        props.onChange(initialValue);
        currentSelected = initialValue;
        console.log(
          "[SlimSelect onMount] After onChange, currentSelected set to:",
          JSON.stringify(currentSelected, null, 2),
        );
      }

      // Clear initializing flag after onChange completes and effects settle
      setTimeout(() => {
        setIsInitializing(false);
        console.log(
          "[SlimSelect onMount] Set isInitializing=false",
          JSON.stringify({ instanceId }, null, 2),
        );
      }, 0);
    }, 0);
  });

  onCleanup(() => {
    slimSelect?.destroy();
    slimSelect = null;
    props.ref?.(null);
  });

  createEffect(() => {
    const selected = props.selected;

    console.log(
      "[SlimSelect createEffect:selected]",
      JSON.stringify(
        {
          instanceId,
          isInitialMount: isInitialMount(),
          selected,
          currentSelected,
        },
        null,
        2,
      ),
    );

    if (isInitialMount()) {
      currentSelected = selected ?? [];
      console.log(
        "[SlimSelect createEffect:selected] Initial mount, set currentSelected to:",
        JSON.stringify(currentSelected, null, 2),
      );
      return;
    }

    if (slimSelect && selected !== undefined) {
      currentSelected = selected;
      console.log(
        "[SlimSelect createEffect:selected] Syncing selected to SlimSelect:",
        JSON.stringify(selected, null, 2),
      );

      // Check if all values are selected - show "all" visually if so
      if (props.addAllOption && props.multiple && props.values) {
        const allPossibleValues = props.values;
        const selectedValues = selected ?? [];

        const allAreSelected =
          allPossibleValues.length > 0 &&
          selectedValues.length === allPossibleValues.length &&
          allPossibleValues.every((v) => selectedValues.includes(v));

        console.log(
          "[SlimSelect createEffect:selected] All check:",
          JSON.stringify(
            { allPossibleValues, selectedValues, allAreSelected },
            null,
            2,
          ),
        );

        if (allAreSelected) {
          const storeData = slimSelect.store.getData();
          // Phase 1: Show only "all" in select box
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected = item.value === "all";
          }
          slimSelect.store.setData(storeData);
          slimSelect.render.renderValues();

          // Phase 2: Show all items checked in dropdown
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected =
              item.value === "all" || allPossibleValues.includes(item.value);
          }
          setTimeout(() => {
            if (!slimSelect) return;
            slimSelect.store.setData(storeData);
            slimSelect.render.renderOptions(storeData);
            console.log(
              "[SlimSelect createEffect:selected] Applied 'all' visual state",
            );
          }, 0);
          return;
        }
      }

      syncSelectedToSlimSelect(selected, false);
    }
  });

  createEffect(() => {
    const values = props.values;
    const selected = props.selected;

    console.log(
      "[SlimSelect createEffect:values]",
      JSON.stringify(
        {
          instanceId,
          isInitialMount: isInitialMount(),
          isInitializing: isInitializing(),
          hasSlimSelect: !!slimSelect,
          hasValues: !!values,
          valuesLength: values?.length,
          globalActiveSlimSelectId,
          valuesReferenceChanged: values !== lastValuesReference,
        },
        null,
        2,
      ),
    );

    if (!isInitialMount() && slimSelect && values) {
      // Skip if values reference hasn't changed
      if (values === lastValuesReference) {
        console.log(
          "[SlimSelect createEffect:values] Skipping - values reference unchanged",
          JSON.stringify(
            {
              instanceId,
            },
            null,
            2,
          ),
        );
        return;
      }

      if (isInitializing()) {
        console.log(
          "[SlimSelect createEffect:values] Skipping update - instance is initializing",
          JSON.stringify(
            {
              instanceId,
            },
            null,
            2,
          ),
        );
        return;
      }

      if (globalActiveSlimSelectId !== undefined) {
        console.log(
          "[SlimSelect createEffect:values] Skipping update - another instance is active",
          JSON.stringify(
            {
              thisInstanceId: instanceId,
              activeInstanceId: globalActiveSlimSelectId,
            },
            null,
            2,
          ),
        );
      }

      const data = buildData(values, selected ?? []);

      console.log(
        "[SlimSelect createEffect:values] Applying update",
        JSON.stringify(
          {
            instanceId,
            valuesLength: values?.length,
            selectedLength: selected?.length,
            valuesPreview: values?.slice(0, 3),
            selectedPreview: selected?.slice(0, 3),
          },
          null,
          2,
        ),
      );

      //@ts-expect-error todo
      slimSelect.store.setData(getDataWithAll(data));

      // Update last data reference AFTER all updates complete
      let shouldUpdateLastRef = true;

      // Handle "all" option visual state when all items are selected
      if (props.addAllOption && props.multiple) {
        const storeData = slimSelect.store.getData();
        const allPossibleValues = getAllOptionValues(storeData);
        const selectedValues = selected ?? [];

        const allAreSelected =
          allPossibleValues.length > 0 &&
          selectedValues.length === allPossibleValues.length;

        console.log(
          "[SlimSelect createEffect:values] All check:",
          JSON.stringify(
            { allPossibleValues, selectedValues, allAreSelected },
            null,
            2,
          ),
        );

        if (allAreSelected) {
          shouldUpdateLastRef = false; // Defer until setTimeout completes
          // Phase 1: Show only "all" in select box
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected = item.value === "all";
          }
          slimSelect.store.setData(storeData);
          slimSelect.render.renderValues();

          // Phase 2: Show all items checked in dropdown
          for (const item of storeData) {
            if (!("value" in item)) continue;
            item.selected =
              item.value === "all" || allPossibleValues.includes(item.value);
          }
          setTimeout(() => {
            if (!slimSelect) return;
            slimSelect.store.setData(storeData);
            slimSelect.render.renderOptions(storeData);
            lastValuesReference = values;
            console.log(
              "[SlimSelect createEffect:values] Applied 'all' visual state",
            );
          }, 0);
          return;
        }
      }

      // Normal case: just render the incoming data
      slimSelect.render.renderValues();
      slimSelect.render.renderOptions(slimSelect.store.getData());

      if (shouldUpdateLastRef) {
        lastValuesReference = values;
      }

      console.log("[SlimSelect createEffect:values] Rendered UI after update");

      if (props.selected !== undefined) {
        console.log(
          "[SlimSelect createEffect:values] Syncing selected after update:",
          JSON.stringify(props.selected, null, 2),
        );
        syncSelectedToSlimSelect(props.selected, false);
      }
    } else {
      console.log(
        "[SlimSelect createEffect:values] Skipped - conditions not met",
      );
    }
  });

  return (
    <select ref={(el) => (selectRef = el)} multiple={props.multiple}>
      {props.children}
    </select>
  );
}
