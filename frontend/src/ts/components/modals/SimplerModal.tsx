import { AnyFieldApi, createForm } from "@tanstack/solid-form";
import { format as dateFormat } from "date-fns/format";
import {
  Accessor,
  For,
  JSXElement,
  Match,
  Show,
  Switch,
  untrack,
} from "solid-js";
import { z, ZodDate, ZodFirstPartyTypeKind, ZodNumber, ZodTypeAny } from "zod";

import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import {
  addNotificationWithLevel,
  showErrorNotification,
  showNoticeNotification,
} from "../../states/notifications";
import {
  GenericSimplerModalInput,
  hideSimplerModal,
  InputsFromSchema,
  simplerModalConfig,
  SimplerModalInput,
} from "../../states/simpler-modal";
import { cn } from "../../utils/cn";
import { typedEntries } from "../../utils/misc";
import { AnimatedModal } from "../common/AnimatedModal";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { fieldMandatory, fromSchema, handleResult } from "../ui/form/utils";

type SyncValidator = (opts: {
  value: string | boolean;
}) => string | string[] | undefined;

type AsyncValidator = (opts: {
  value: string | boolean;
  fieldApi: AnyFieldApi;
}) => Promise<string | string[] | undefined>;

type SimpleModalValidators = {
  onChange?: SyncValidator;
  onChangeAsyncDebounceMs?: number;
  onChangeAsync?: AsyncValidator;
};

export function SimplerModal(): JSXElement {
  const config = simplerModalConfig;

  // untrack prevents tanstack's internal createComputed from
  // re-running api.update() when config changes, which would
  // cause a re-render cascade during the modal's show animation.
  const form = createForm(() => ({
    defaultValues: untrack(() => getDefaultValues(config()?.inputs)),
    onSubmit: async ({ value }) => {
      const schema = config()?.schema as z.Schema;
      // oxlint-disable-next-line typescript/no-explicit-any
      const inputs = config()?.inputs as InputsFromSchema<any>;
      const simpleConfig = config();
      if (simpleConfig === null) return;

      const converted = Object.fromEntries(
        Object.entries(value).map(([key, value]) => [
          key,
          // @ts-expect-error this is fine
          // oxlint-disable-next-line typescript/no-unsafe-member-access typescript/no-unsafe-argument
          convertFn(inputs[key], schema.shape[key])(value as string | boolean),
        ]),
      );

      showLoaderBar();
      try {
        const res = await simpleConfig.execFn(converted);
        hideLoaderBar();

        if (res.showNotification !== false) {
          addNotificationWithLevel(
            res.message,
            res.status,
            res.notificationOptions,
          );
        }

        if (res.status === "success" || res.alwaysHide) {
          hideSimplerModal();
          res.afterHide?.();
        }
      } catch (error) {
        console.error("Error executing simple modal function:", error);
        showErrorNotification("An unexpected error occurred", {
          error,
        });
        hideLoaderBar();
      }
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
  }));

  const resetForm = (): void => {
    const defaults = getDefaultValues(config()?.inputs);
    form.update({ ...form.options, defaultValues: defaults });
    form.reset();
  };

  const getSchema = (key: string) =>
    // oxlint-disable-next-line typescript/no-unsafe-member-access
    config()?.schema?.shape[key] as z.ZodTypeAny;

  return (
    <AnimatedModal
      id="SimplerModal"
      title={config()?.title}
      focusFirstInput={config()?.focusFirstInput ?? true}
      beforeShow={resetForm}
      modalClass={config()?.class}
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Show when={config()?.text}>
          {(text) => (
            <div
              class={cn("text-text", config()?.textClass)}
              {...(config()?.textAllowHtml === true
                ? { innerHTML: text() }
                : { textContent: text() })}
            ></div>
          )}
        </Show>

        <Show when={Object.keys(config()?.inputs ?? {}).length > 0}>
          <div class="grid gap-2">
            <For each={typedEntries(config()?.inputs ?? {})}>
              {([key, input]) => {
                const name: string = key;

                return (
                  <Show when={!input.hidden}>
                    <form.Field
                      name={name}
                      validators={getValidators(input, getSchema(key))}
                      children={(field) => (
                        <Show
                          when={
                            input.type !== "checkbox" &&
                            input.label !== undefined &&
                            input.label !== ""
                          }
                          fallback={
                            <FieldInput
                              field={field}
                              input={input}
                              schema={getSchema(key)}
                            />
                          }
                        >
                          <label class="grid w-full grid-cols-[1fr_2fr] items-center gap-2 text-sub">
                            <div>{input.label}</div>

                            <FieldInput
                              field={field}
                              input={input}
                              schema={getSchema(key)}
                            />
                          </label>
                        </Show>
                      )}
                    />
                  </Show>
                );
              }}
            </For>
          </div>
        </Show>

        <Show when={config()?.buttonText !== undefined}>
          <SubmitButton
            form={form}
            variant="button"
            class="w-full"
            text={config()?.buttonText}
            skipUnchangedCheck={
              config()?.buttonAlwaysEnabled === true ||
              Object.keys(config()?.inputs ?? {}).length === 0
            }
          />
        </Show>
      </form>
    </AnimatedModal>
  );
}

function getDefaultValues(
  // oxlint-disable-next-line typescript/no-explicit-any
  inputs: InputsFromSchema<any> | undefined,
): Object {
  if (inputs === undefined || Object.keys(inputs).length === 0) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(inputs).map(([key, input]) => [key, input.initVal ?? null]),
  );
}

function getValidators(
  input: GenericSimplerModalInput,
  schema: z.Schema,
): SimpleModalValidators | undefined {
  const required =
    !input.hidden && !schema.isOptional() && input.type !== "checkbox";
  const isValid = input.validation?.isValid;

  if (schema === undefined && isValid === undefined && !required) {
    return undefined;
  }

  const validators: SimpleModalValidators = {};
  const convert = convertFn(input, schema);

  if (schema !== undefined) {
    // oxlint-disable-next-line typescript/no-unsafe-argument
    validators.onChange = fromSchema(schema, {
      convert,
    }) as SyncValidator;
  } else if (required) {
    validators.onChange = fieldMandatory() as SyncValidator;
  }

  if (isValid !== undefined) {
    validators.onChangeAsyncDebounceMs = input.validation?.debounceDelay ?? 100;
    validators.onChangeAsync = async ({ value, fieldApi }) => {
      const result = await isValid(String(value));
      if (result === true) {
        return undefined;
      }
      if (typeof result === "string") {
        return result;
      }
      return handleResult(fieldApi, [
        { type: "warning", message: result.warning },
      ]);
    };
  }

  return validators;
}

function FieldInput(props: {
  field: Accessor<AnyFieldApi>;
  input: GenericSimplerModalInput;
  schema: z.ZodTypeAny;
}): JSXElement {
  const formatDate = (date: Date | undefined) =>
    date === undefined
      ? undefined
      : dateFormat(
          date,
          props.input.type === "date" ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm:ss",
        );
  return (
    <Switch
      fallback={
        <InputField
          field={props.field}
          type={props.input.type}
          placeholder={props.input.placeholder}
          disabled={props.input.disabled}
          readOnly={
            "readOnly" in props.input
              ? (props.input as { readOnly?: boolean }).readOnly
              : undefined
          }
          clickToSelect={
            "clickToSelect" in props.input
              ? (props.input as { clickToSelect?: boolean }).clickToSelect
              : undefined
          }
          class={props.input.class}
          autocomplete="off"
          {...getMinAndMax(props.schema)}
        />
      }
    >
      <Match when={props.input.type === "checkbox"}>
        <Checkbox
          field={props.field}
          label={(props.input as { label: string }).label}
          disabled={props.input.disabled}
          class={props.input.class}
        />
      </Match>
      <Match when={props.input.type === "textarea"}>
        <textarea
          class={cn("w-full", props.input.class)}
          placeholder={props.input.placeholder}
          value={props.field().state.value as string}
          disabled={props.input.disabled}
          readOnly={(props.input as { readOnly?: boolean }).readOnly}
          autocomplete="off"
          onInput={(e) => {
            props.field().handleChange(e.currentTarget.value);
            props.input.oninput?.(e);
          }}
          onClick={(e) => {
            if ((props.input as { clickToSelect?: boolean }).clickToSelect) {
              e.currentTarget.select();
            }
          }}
          onBlur={() => props.field().handleBlur()}
        ></textarea>
      </Match>
      <Match when={props.input.type === "range"}>
        <div class="flex items-center gap-2">
          <input
            type="range"
            class={cn(
              props.input.hidden && "hidden",
              "w-full",
              props.input.class,
            )}
            {...getMinAndMax(props.schema)}
            step={(props.input as { step?: number }).step}
            value={props.field().state.value as string}
            disabled={props.input.disabled}
            onInput={(e) => {
              props.field().handleChange(e.currentTarget.value);
              props.input.oninput?.(e);
            }}
            onBlur={() => props.field().handleBlur()}
          />
          <span class="text-sub">{props.field().state.value as string}</span>
        </div>
      </Match>

      <Match
        when={
          props.input.type === "datetime-local" || props.input.type === "date"
        }
      >
        <input
          type={props.input.type}
          class={cn("w-full", props.input.class)}
          value={formatDate(props.field().state.value as Date)}
          disabled={props.input.disabled}
          {...getDateMinAndMax(props.schema, formatDate)}
          onInput={(e) => {
            props.field().handleChange(e.currentTarget.value);
            props.input.oninput?.(e);
          }}
          onBlur={() => props.field().handleBlur()}
        />
      </Match>
    </Switch>
  );
}

/**
 * Creates a converter function that transforms raw user input
 * (typically a string or boolean from UI components)
 * into the correct runtime type expected by a given Zod schema.
 *
 * The returned function:
 *   - normalizes the raw value (string → number, string → boolean, etc.)
 *   - applies optional `input.preprocess`
 *   - validates the result using the provided Zod schema
 *   - returns the parsed value as type `T`
 *
 * @template T The final inferred type after Zod parsing.
 *
 * @param input - A SimplerModalInput<T> describing preprocessing behavior.
 * @param schema - A Zod schema whose type determines how the value is converted.
 *
 * @returns A function that accepts a raw value (string | boolean)
 *          and returns a validated value of type `T`.
 */
export function convertFn<T>(
  input: SimplerModalInput<T>,
  schema: z.ZodTypeAny,
): (val: string | boolean) => T {
  // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
  const type = schema._def["typeName"];
  const preprocess = (raw: unknown): T => {
    const value = input.preprocess ? input.preprocess(raw as T) : raw;
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return value as T;
    }

    return parsed.data as T;
  };

  switch (type) {
    case ZodFirstPartyTypeKind.ZodBoolean:
      return (val) => {
        const bool =
          typeof val === "boolean" ? val : val === "true" || val === "1";
        return preprocess(bool);
      };

    case ZodFirstPartyTypeKind.ZodNumber:
      return (val) => {
        const num = typeof val === "string" ? parseFloat(val) : Number(val);
        return preprocess(num);
      };

    case ZodFirstPartyTypeKind.ZodDate:
      return (val) => {
        const date = new Date(val as string);
        return preprocess(date);
      };

    default:
      return (val) => preprocess(val);
  }
}

function getMinAndMax(schema: ZodTypeAny): {
  min?: number | undefined;
  max?: number | undefined;
} {
  // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
  const type = schema._def["typeName"];

  if (type !== ZodFirstPartyTypeKind.ZodNumber) return {};

  return {
    min: (schema as ZodNumber).minValue ?? undefined,
    max: (schema as ZodNumber).maxValue ?? undefined,
  };
}
function getDateMinAndMax(
  schema: ZodTypeAny,
  format: (val: Date | undefined) => string,
): {
  min?: string | undefined;
  max?: string | undefined;
} {
  // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
  const type = schema._def["typeName"];
  if (type !== ZodFirstPartyTypeKind.ZodDate) return {};

  const applyFormat = (it: Date | null) =>
    it === null ? undefined : format(it);

  return {
    min: applyFormat((schema as ZodDate).minDate),
    max: applyFormat((schema as ZodDate).maxDate),
  };
}
