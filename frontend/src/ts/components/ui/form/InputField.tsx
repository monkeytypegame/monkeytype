import { AnyFieldApi } from "@tanstack/solid-form";
import { format as dateFormat } from "date-fns/format";
import { Accessor, createSignal, JSXElement, Show } from "solid-js";
import { ZodDate, ZodFirstPartyTypeKind, ZodNumber, ZodTypeAny } from "zod";

import { cn } from "../../../utils/cn";
import { getZodType, unwrapSchema } from "../../../utils/zod";
import { FieldIndicator } from "./FieldIndicator";

export function InputField(props: {
  field: Accessor<AnyFieldApi>;
  placeholder?: string;
  autocomplete?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clickToSelect?: boolean;
  class?: string;
  dir?: "ltr" | "rtl" | "auto";
  maxLength?: number;
  onFocus?: () => void;
  /**
   * If user inputs empty string the field is resetted to the default value
   */
  resetToDefaultIfEmptyOnBlur?: boolean;
  schema?: ZodTypeAny;
  min?: number;
  max?: number;
  step?: string | number;
  alwaysShowFieldIndicator?: boolean;
}): JSXElement {
  const [shake, setShake] = createSignal(false);

  const shakeItIfYouWantIt = () => {
    if (
      props.field().state.meta.isTouched &&
      !props.field().state.meta.isValid
    ) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  const formatDate = (date: Date | undefined) =>
    date === undefined
      ? undefined
      : dateFormat(
          date,
          props.type === "date" ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm:ss",
        );

  return (
    <div
      class="grid w-full"
      style={
        shake() ? { animation: "shake 0.1s ease-in-out infinite" } : undefined
      }
    >
      <input
        class={cn(
          "col-start-1 row-start-1 w-full",
          "rounded border-none bg-sub-alt p-[0.5em] text-em-base leading-[1.25em] caret-main outline-none",
          "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
          "autofill-fix",
          props.field().options.validators ? "pr-[1.85em]" : "",
          props.class,
        )}
        type={props.type ?? "text"}
        placeholder={props.placeholder ?? ""}
        autocomplete={props.autocomplete}
        name={props.field().name as string}
        value={convertValueToString(props.field().state.value)}
        onBlur={() => {
          if (
            props.resetToDefaultIfEmptyOnBlur &&
            props.field().state.value === undefined
          ) {
            props.field().setValue(
              // oxlint-disable-next-line typescript/no-unsafe-member-access
              props.field().form.options.defaultValues?.[props.field().name],
            );
          }
          shakeItIfYouWantIt();
          props.field().handleBlur();
        }}
        onInput={(e) => {
          const value: unknown = convertStringToValue(
            props.field().state.value,
            e.target.value,
          );
          props.field().handleChange(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            shakeItIfYouWantIt();
          }
        }}
        disabled={props.disabled}
        readOnly={props.readOnly}
        onClick={(e) => {
          if (props.clickToSelect) e.currentTarget.select();
        }}
        onFocus={() => props.onFocus?.()}
        dir={props.dir}
        maxLength={props.maxLength}
        {...getNumberOptions(props.schema)}
        {...getDateOptions(props.schema, formatDate)}
        min={props.min}
        max={props.max}
        step={props.step?.toString()}
      />
      <Show when={props.field().options.validators}>
        <FieldIndicator
          field={props.field()}
          alwaysShow={props.alwaysShowFieldIndicator}
        />
      </Show>
    </div>
  );
}

function getNumberOptions(rawSchema: ZodTypeAny | undefined): {
  min?: number;
  max?: number;
  step?: string;
} {
  if (rawSchema === undefined) return {};
  const schema = unwrapSchema(rawSchema);
  if (getZodType(schema) !== ZodFirstPartyTypeKind.ZodNumber) return {};
  const numberSchema = schema as ZodNumber;

  return {
    min: numberSchema.minValue ?? undefined,
    max: numberSchema.maxValue ?? undefined,
    step: numberSchema.isInt ? "1" : "any",
  };
}

function getDateOptions(
  rawSchema: ZodTypeAny | undefined,
  format: (val: Date | undefined) => string | undefined,
): {
  min?: string;
  max?: string;
} {
  if (rawSchema === undefined) return {};
  const schema = unwrapSchema(rawSchema);
  if (getZodType(schema) !== ZodFirstPartyTypeKind.ZodDate) return {};

  const applyFormat = (it: Date | null) =>
    it === null ? undefined : format(it);

  return {
    min: applyFormat((schema as ZodDate).minDate),
    max: applyFormat((schema as ZodDate).maxDate),
  };
}

function convertValueToString(input: unknown | undefined): string {
  if (input === undefined || input === null) return "";
  if (typeof input === "boolean") return input ? "true" : "false";
  if (typeof input === "number") {
    if (isFinite(input)) return input.toString();
    else return "";
  }
  return input as string;
}

function convertStringToValue<T extends unknown | undefined>(
  defaultValue: T,
  newValue: string,
): T | undefined {
  if (defaultValue === undefined || defaultValue === null) return newValue as T;
  if (typeof defaultValue === "boolean") {
    return (newValue === "true" || newValue === "1") as T;
  }
  if (newValue === "") return undefined;
  if (typeof defaultValue === "number") return Number.parseFloat(newValue) as T;

  return newValue as T;
}
