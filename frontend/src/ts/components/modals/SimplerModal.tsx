import { TagNameSchema } from "@monkeytype/schemas/users";
import { z, ZodTypeAny } from "zod";

import { ExecReturn } from "../../states/simple-modal";
import { Validation } from "../../types/validation";
import { normalizeName } from "../../utils/strings";

type InferSchema<T extends ZodTypeAny> = z.infer<T>;

type CommonInput<TType, TValue> = {
  type?: TType;
  initVal?: TValue;
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  optional?: boolean;
  label?: string;
  class?: string;
  oninput?: (event: Event) => void;
  /**
   * preprocess is applied before validation and execFn
   * @param value
   * @returns
   */
  preprocess?: (value: TValue) => TValue;
  validation?: Omit<Validation<TValue>, "schema">;
};

// strings
type TextInput<T extends string> = {
  readOnly?: boolean;
  clickToSelect?: boolean;
} & CommonInput<"text", T>;

type TextArea<T extends string> = {
  readOnly?: boolean;
  clickToSelect?: boolean;
} & CommonInput<"textarea", T>;

type PasswordInput<T extends string> = CommonInput<"password", T>;
type EmailInput<T extends string> = CommonInput<"email", T>;

type StringTypeInput<T extends string> =
  | TextInput<T>
  | TextArea<T>
  | PasswordInput<T>
  | EmailInput<T>;

// numbers
type NumberInput<T extends number> = {
  min?: number;
  max?: number;
} & CommonInput<"number", T>;

type RangeInput<T extends number> = {
  min: number;
  max: number;
  step?: number;
} & CommonInput<"range", T>;

type NumberTypeInput<T extends number> = NumberInput<T> | RangeInput<T>;

// booleans
type CheckboxInput<T extends boolean> = {
  label: string;
  placeholder?: never;
  description?: string;
} & CommonInput<"checkbox", T>;

type BooleanTypeInput<T extends boolean> = CheckboxInput<T>;

// dates

type DateInput<T extends Date> = { min?: Date; max?: Date } & CommonInput<
  "date",
  T
>;

type DateTimeInput<T extends Date> = { min?: Date; max?: Date } & CommonInput<
  "datetime-local",
  T
>;

type DateTypeInput<T extends Date> = DateInput<T> | DateTimeInput<T>;

type InputConfig<T> = T extends string
  ? StringTypeInput<T>
  : T extends number
    ? NumberTypeInput<T>
    : T extends boolean
      ? BooleanTypeInput<T>
      : T extends Date
        ? DateTypeInput<T>
        : never;

// oxlint-disable-next-line typescript/no-explicit-any
type InputsFromSchema<S extends z.ZodObject<any>> = {
  [K in keyof S["shape"]]: InputConfig<z.infer<S["shape"][K]>>;
};

// oxlint-disable-next-line typescript/no-explicit-any
export type SimplerModalConfig<S extends z.ZodObject<any>> = {
  title: string;
  schema: S;
  inputs: InputsFromSchema<S>;

  text?: string | { display: string; class?: string; allowHtml?: boolean };

  button?: string | { text: string; alwaysEnabled?: boolean };
  focusFirstInput?: true | "focusAndSelect";

  execFn: (values: InferSchema<S>) => Promise<ExecReturn>;
};

// oxlint-disable-next-line typescript/no-explicit-any
function showSimplerModal<S extends z.ZodObject<any>>(
  args: SimplerModalConfig<S>,
) {
  return args;
}

const _formConfig = showSimplerModal({
  title: "Enter minimum and maximum number of words",
  button: "save",
  schema: z.object({
    text: z.string().min(5),
    min: z.number().safe().positive(),
    max: z.number().safe().positive(),
    tagName: TagNameSchema,
    date: z.date(),
  }),
  inputs: {
    text: {
      type: "textarea",
      initVal: "test",
    },
    min: {
      placeholder: "0",
      initVal: 0,
    },
    max: {
      placeholder: "100",
    },
    tagName: {
      placeholder: "tag name",
      preprocess: normalizeName,
    },
    date: {
      type: "datetime-local",
      min: new Date(),
    },
  },
  execFn: async ({ text, date }) => {
    console.log({ text, date });
    return { status: "success", message: "Saved custom filter" };
  },
});
