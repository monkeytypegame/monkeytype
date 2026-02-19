import SlimSelectCore, { Config } from "slim-select";
import { Optgroup, Option } from "slim-select/store";
import { onMount, onCleanup, createEffect, createSignal } from "solid-js";
import type { JSX, JSXElement } from "solid-js";

// Global flag to prevent all SlimSelects from receiving data updates during any user interaction
let globalActiveSlimSelectId: number | undefined;
let globalUserChangeTimeoutId: number | undefined;
let nextSlimSelectId = 0;

export type SlimSelectProps = {
  data?: (Partial<Option> | Partial<Optgroup>)[];
  settings?: Config["settings"] & { scrollToTop?: boolean };
  events?: Config["events"];
  cssClasses?: Config["cssClasses"];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  dataSetter?: (data: (Partial<Option> | Partial<Optgroup>)[]) => void;
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
  let currentValue: string | string[] | undefined = props.value;
  const instanceId = nextSlimSelectId++;
  let lastDataReference: typeof props.data | undefined = undefined;

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
              currentValue,
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
                  JSON.stringify(
                    [
                      ...(Array.isArray(currentValue) ? currentValue : []),
                    ].sort(),
                  )
              ) {
                console.log("[SlimSelect] Calling onChange with all values");
                props.onChange(allValues);
                currentValue = allValues;
              } else {
                console.log(
                  "[SlimSelect] Skipped onChange (no change or no handler)",
                );
              }

              // Automatic two-way binding with dataSetter
              if (props.dataSetter && props.data) {
                const updatedData = props.data.map((item) => {
                  if ("label" in item && item.options) {
                    const updatedOptions = item.options.map((opt) => {
                      const isSelected = allValues.includes(String(opt.value));
                      return Object.assign({}, opt, { selected: isSelected });
                    });
                    return Object.assign({}, item, { options: updatedOptions });
                  } else if ("value" in item && item.value !== "all") {
                    const isSelected = allValues.includes(String(item.value));
                    return Object.assign({}, item, { selected: isSelected });
                  }
                  return item;
                });
                console.log(
                  "[SlimSelect beforeChange] Calling dataSetter after 'all' click",
                );
                props.dataSetter(updatedData);
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

              // Automatic two-way binding with dataSetter (keep all selected)
              if (props.dataSetter && props.data) {
                const updatedData = props.data.map((item) => {
                  if ("label" in item && item.options) {
                    const updatedOptions = item.options.map((opt) => {
                      const isSelected = allValues.includes(String(opt.value));
                      return Object.assign({}, opt, { selected: isSelected });
                    });
                    return Object.assign({}, item, { options: updatedOptions });
                  } else if ("value" in item && item.value !== "all") {
                    const isSelected = allValues.includes(String(item.value));
                    return Object.assign({}, item, { selected: isSelected });
                  }
                  return item;
                });
                console.log(
                  "[SlimSelect beforeChange] Calling dataSetter after switching from 'all' to individual",
                );
                props.dataSetter(updatedData);
              }

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
                  JSON.stringify(
                    [
                      ...(Array.isArray(currentValue) ? currentValue : []),
                    ].sort(),
                  )
              ) {
                console.log("[SlimSelect] Calling onChange with new selection");
                props.onChange(newSelection);
                currentValue = newSelection;
              } else {
                console.log(
                  "[SlimSelect] Skipped onChange (no change or no handler)",
                );
              }

              // Automatic two-way binding with dataSetter
              if (props.dataSetter && props.data) {
                const updatedData = props.data.map((item) => {
                  if ("label" in item && item.options) {
                    const updatedOptions = item.options.map((opt) => {
                      const isSelected = newSelection.includes(
                        String(opt.value),
                      );
                      return Object.assign({}, opt, { selected: isSelected });
                    });
                    return Object.assign({}, item, { options: updatedOptions });
                  } else if ("value" in item && item.value !== "all") {
                    const isSelected = newSelection.includes(
                      String(item.value),
                    );
                    return Object.assign({}, item, { selected: isSelected });
                  }
                  return item;
                });
                console.log(
                  "[SlimSelect beforeChange] Calling dataSetter after deselecting while 'all' active",
                );
                props.dataSetter(updatedData);
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
              if (
                props.onChange &&
                (Array.isArray(currentValue)
                  ? currentValue.length > 0
                  : currentValue !== "")
              ) {
                console.log("[SlimSelect] Calling onChange with empty array");
                props.onChange([]);
                currentValue = [];
              } else {
                console.log(
                  "[SlimSelect] Skipped onChange (already empty or no handler)",
                );
              }

              // Automatic two-way binding with dataSetter
              if (props.dataSetter && props.data) {
                const updatedData = props.data.map((item) => {
                  if ("label" in item && item.options) {
                    const updatedOptions = item.options.map((opt) =>
                      Object.assign({}, opt, { selected: false }),
                    );
                    return Object.assign({}, item, { options: updatedOptions });
                  } else if ("value" in item && item.value !== "all") {
                    return Object.assign({}, item, { selected: false });
                  }
                  return item;
                });
                console.log(
                  "[SlimSelect beforeChange] Calling dataSetter after deselecting 'all'",
                );
                props.dataSetter(updatedData);
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
              currentValue,
              addAllOption: props.addAllOption,
              globalActiveSlimSelectId,
            },
            null,
            2,
          ),
        );

        if (!slimSelect) return;

        let newValue = props.multiple
          ? newVal.map((o) => o.value)
          : (newVal[0]?.value ?? "");

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

        console.log(
          "[SlimSelect afterChange] Validation:",
          JSON.stringify(
            {
              currentValueExists,
              newValueIsValid,
              valueChanged,
              currentValue,
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
          currentValue = newValue;
        } else {
          console.log(
            "[SlimSelect afterChange] Skipped onChange:",
            JSON.stringify(
              {
                hasOnChange: !!props.onChange,
                valueChanged,
                currentValueExists,
                newValueIsValid,
                currentValue,
                newValue,
              },
              null,
              2,
            ),
          );
        }

        // Automatic two-way binding with dataSetter
        if (props.dataSetter && props.data && valueChanged) {
          const selectedValues = Array.isArray(newValue)
            ? newValue
            : [newValue];
          const updatedData = props.data.map((item) => {
            if ("label" in item && item.options) {
              // Handle optgroup
              const updatedOptions = item.options.map((opt) => {
                const isSelected = selectedValues.includes(String(opt.value));
                return Object.assign({}, opt, { selected: isSelected });
              });
              return Object.assign({}, item, { options: updatedOptions });
            } else if ("value" in item && item.value !== "all") {
              // Handle regular option (skip "all" option)
              const isSelected = selectedValues.includes(String(item.value));
              return Object.assign({}, item, { selected: isSelected });
            }
            return item;
          });
          console.log(
            "[SlimSelect afterChange] Calling dataSetter with updated data",
          );
          props.dataSetter(updatedData);
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

    // Store initial data reference
    lastDataReference = props.data;

    // expose instance
    props.ref?.(slimSelect);

    if (props.value !== undefined) {
      syncValueToSlimSelect(props.value, false);
    }

    console.log(
      "[SlimSelect onMount] Setting isInitialMount to false",
      JSON.stringify({ instanceId, currentValue }, null, 2),
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
            hasData: !!props.data,
            hasSlimSelect: !!slimSelect,
            currentValue,
          },
          null,
          2,
        ),
      );

      if (!props.onChange || !props.data || !slimSelect) {
        setIsInitializing(false);
        console.log(
          "[SlimSelect onMount setTimeout] No onChange/data/slimSelect, set isInitializing=false",
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
        let initialValue = props.multiple
          ? selectedOptions.map((o) => o.value)
          : (selectedOptions[0]?.value ?? "");

        // Handle "all" option
        if (props.addAllOption && Array.isArray(initialValue)) {
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
              currentValueBefore: currentValue,
            },
            null,
            2,
          ),
        );
        props.onChange(initialValue);
        currentValue = initialValue;
        console.log(
          "[SlimSelect onMount] After onChange, currentValue set to:",
          JSON.stringify(currentValue, null, 2),
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
    const value = props.value;

    console.log(
      "[SlimSelect createEffect:value]",
      JSON.stringify(
        {
          instanceId,
          isInitialMount: isInitialMount(),
          value,
          currentValue,
        },
        null,
        2,
      ),
    );

    if (isInitialMount()) {
      currentValue = value;
      console.log(
        "[SlimSelect createEffect:value] Initial mount, set currentValue to:",
        JSON.stringify(currentValue, null, 2),
      );
      return;
    }

    if (slimSelect && value !== undefined) {
      currentValue = value;
      console.log(
        "[SlimSelect createEffect:value] Syncing value to SlimSelect:",
        JSON.stringify(value, null, 2),
      );
      syncValueToSlimSelect(value, false);
    }
  });

  createEffect(() => {
    const data = props.data;

    console.log(
      "[SlimSelect createEffect:data]",
      JSON.stringify(
        {
          instanceId,
          isInitialMount: isInitialMount(),
          isInitializing: isInitializing(),
          hasSlimSelect: !!slimSelect,
          hasData: !!data,
          dataLength: data?.length,
          globalActiveSlimSelectId,
          dataReferenceChanged: data !== lastDataReference,
        },
        null,
        2,
      ),
    );

    if (!isInitialMount() && slimSelect && data) {
      // Skip if data reference hasn't changed
      if (data === lastDataReference) {
        console.log(
          "[SlimSelect createEffect:data] Skipping - data reference unchanged",
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
          "[SlimSelect createEffect:data] Skipping data update - instance is initializing",
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
          "[SlimSelect createEffect:data] Skipping data update - ANY instance is being interacted with",
          JSON.stringify(
            {
              thisInstanceId: instanceId,
              activeInstanceId: globalActiveSlimSelectId,
              dataSelected: data
                ?.filter((d) => "selected" in d && d.selected)
                .map((d) => ("value" in d ? d.value : null)),
            },
            null,
            2,
          ),
        );
        return;
      }

      console.log(
        "[SlimSelect createEffect:data] Applying data update",
        JSON.stringify(
          {
            instanceId,
            dataLength: data?.length,
            dataPreview: data
              ?.slice(0, 3)
              .map((d) => ("value" in d ? d.value : "group")),
            dataSelected: data
              ?.filter((d) => "selected" in d && d.selected)
              .map((d) => ("value" in d ? d.value : null)),
          },
          null,
          2,
        ),
      );
      //@ts-expect-error todo
      slimSelect.store.setData(getDataWithAll(data));

      // Update last data reference
      lastDataReference = data;

      // Force visual update
      slimSelect.render.renderValues();
      slimSelect.render.renderOptions(slimSelect.store.getData());
      console.log(
        "[SlimSelect createEffect:data] Rendered UI after data update",
      );

      if (props.value !== undefined) {
        console.log(
          "[SlimSelect createEffect:data] Syncing value after data update:",
          JSON.stringify(props.value, null, 2),
        );
        syncValueToSlimSelect(props.value, false);
      }
    } else {
      console.log(
        "[SlimSelect createEffect:data] Skipped - conditions not met",
      );
    }
  });

  return (
    <select ref={(el) => (selectRef = el)} multiple={props.multiple}>
      {props.children}
    </select>
  );
}
