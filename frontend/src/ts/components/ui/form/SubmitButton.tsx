// oxlint-disable typescript/no-explicit-any
import { SolidFormApi } from "@tanstack/solid-form";
import { JSXElement, splitProps } from "solid-js";

import { Button, ButtonProps } from "../../common/Button";

export function SubmitButton(
  props: {
    form: SolidFormApi<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >;
  } & Omit<ButtonProps, "type">,
): JSXElement {
  const [local, others] = splitProps(props, ["disabled"]);
  return (
    <props.form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
        isValid: state.isValid,
        isDirty: state.isDirty,
      })}
      children={(state) => (
        <Button
          type="submit"
          {...others}
          disabled={
            (local.disabled ?? false) ||
            !state().isDirty ||
            !state().canSubmit ||
            state().isSubmitting ||
            !state().isValid
          }
        />
      )}
    />
  );
}
