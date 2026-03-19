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

import { showNoticeNotification } from "../../states/notifications";
import {
  simpleModalConfig,
  SimpleModalInput,
  executeSimpleModal,
} from "../../states/simple-modal";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { fromSchema, fieldMandatory, handleResult } from "../ui/form/utils";

type FormValues = Record<string, string | boolean>;

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

function inputKey(input: SimpleModalInput, index: number): string {
  return input.name ?? index.toString();
}

function getDefaultValues(inputs: SimpleModalInput[] | undefined): FormValues {
  if (inputs === undefined || inputs.length === 0) {
    return {};
  }
  const entries: [string, string | boolean][] = inputs.map((input, i) => {
    const key = inputKey(input, i);
    if (input.type === "checkbox") {
      return [key, input.initVal ?? false];
    }
    if (input.type === "datetime-local" && input.initVal !== undefined) {
      return [key, dateFormat(input.initVal, "yyyy-MM-dd'T'HH:mm:ss")];
    }
    if (input.type === "date" && input.initVal !== undefined) {
      return [key, dateFormat(input.initVal, "yyyy-MM-dd")];
    }
    return [key, input.initVal?.toString() ?? ""];
  });
  return Object.fromEntries(entries) as FormValues;
}

function getValidators(
  input: SimpleModalInput,
): SimpleModalValidators | undefined {
  const required =
    !input.hidden && !input.optional && input.type !== "checkbox";

  const schema = input.validation?.schema;
  const isValid = input.validation?.isValid;

  if (schema === undefined && isValid === undefined && !required) {
    return undefined;
  }

  const validators: SimpleModalValidators = {};

  if (schema !== undefined) {
    validators.onChange = fromSchema(schema) as SyncValidator;
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
  input: SimpleModalInput;
}): JSXElement {
  return (
    <Switch
      fallback={
        <InputField
          field={props.field}
          type={props.input.type}
          placeholder={props.input.placeholder}
          disabled={props.input.disabled}
          autocomplete="off"
        />
      }
    >
      <Match when={props.input.type === "checkbox"}>
        <Checkbox
          field={props.field}
          label={(props.input as { label: string }).label}
          disabled={props.input.disabled}
        />
      </Match>
      <Match when={props.input.type === "textarea"}>
        <textarea
          class="w-full"
          placeholder={props.input.placeholder}
          value={props.field().state.value as string}
          disabled={props.input.disabled}
          autocomplete="off"
          onInput={(e) => {
            props.field().handleChange(e.currentTarget.value);
            props.input.oninput?.(e);
          }}
          onBlur={() => props.field().handleBlur()}
        ></textarea>
      </Match>
      <Match when={props.input.type === "range"}>
        <div class="flex items-center gap-2">
          <input
            type="range"
            class={cn(props.input.hidden && "hidden", "w-full")}
            min={(props.input as { min: number }).min}
            max={(props.input as { max: number }).max}
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
          class="w-full"
          value={props.field().state.value as string}
          disabled={props.input.disabled}
          min={
            (props.input as { min?: Date }).min !== undefined
              ? dateFormat(
                  (props.input as { min: Date }).min,
                  props.input.type === "date"
                    ? "yyyy-MM-dd"
                    : "yyyy-MM-dd'T'HH:mm:ss",
                )
              : undefined
          }
          max={
            (props.input as { max?: Date }).max !== undefined
              ? dateFormat(
                  (props.input as { max: Date }).max,
                  props.input.type === "date"
                    ? "yyyy-MM-dd"
                    : "yyyy-MM-dd'T'HH:mm:ss",
                )
              : undefined
          }
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

export function SimpleModal(): JSXElement {
  const config = simpleModalConfig;

  // untrack prevents tanstack's internal createComputed from
  // re-running api.update() when config changes, which would
  // cause a re-render cascade during the modal's show animation.
  const form = createForm(() => ({
    defaultValues: untrack(() => getDefaultValues(config()?.inputs)),
    onSubmit: async ({ value }) => {
      const inputs = config()?.inputs ?? [];
      const values = inputs.map((input, i) => {
        const val = value[inputKey(input, i)];
        if (typeof val === "boolean") {
          return val ? "true" : "false";
        }
        return val?.toString() ?? "";
      });
      await executeSimpleModal(values);
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

  return (
    <AnimatedModal
      id="SimpleModal"
      title={config()?.title}
      focusFirstInput={true}
      beforeShow={resetForm}
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
              class="text-sub"
              {...(config()?.textAllowHtml === true
                ? { innerHTML: text() }
                : { textContent: text() })}
            ></div>
          )}
        </Show>
        <Show when={(config()?.inputs?.length ?? 0) > 0}>
          <div class="grid gap-2">
            <For each={config()?.inputs}>
              {(input, i) => (
                <Show when={!input.hidden}>
                  <form.Field
                    name={inputKey(input, i())}
                    validators={getValidators(input)}
                    children={(field) => (
                      <Show
                        when={
                          input.type !== "checkbox" &&
                          input.label !== undefined &&
                          input.label !== ""
                        }
                        fallback={<FieldInput field={field} input={input} />}
                      >
                        <label class="grid w-full grid-cols-[1fr_2fr] items-center gap-2 text-sub">
                          <div>{input.label}</div>
                          <FieldInput field={field} input={input} />
                        </label>
                      </Show>
                    )}
                  />
                </Show>
              )}
            </For>
          </div>
        </Show>
        <Show when={config()?.buttonText !== undefined}>
          <SubmitButton
            form={form}
            variant="button"
            class="w-full"
            text={config()?.buttonText}
            skipDirtyCheck={(config()?.inputs?.length ?? 0) === 0}
          />
        </Show>
      </form>
    </AnimatedModal>
  );
}
