import { JSXElement, splitProps } from "solid-js";

import { Button, ButtonProps } from "../../common/Button";

type FormStateSlice = {
  canSubmit: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
};

type SubscribableForm = {
  Subscribe: (props: {
    selector: (state: {
      canSubmit: boolean;
      isSubmitting: boolean;
      isValid: boolean;
      isDirty: boolean;
    }) => FormStateSlice;
    children: (state: () => FormStateSlice) => JSXElement;
  }) => JSXElement;
};

export function SubmitButton(
  props: {
    form: SubscribableForm;
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
