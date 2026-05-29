import { JSXElement, splitProps } from "solid-js";

import { Button, ButtonProps } from "../../common/Button";

export type FormStateSlice = {
  canSubmit: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  isDefaultValue: boolean;
};

type SubscribableForm = {
  Subscribe: (props: {
    selector: (state: FormStateSlice) => FormStateSlice;
    children: (state: () => FormStateSlice) => JSXElement;
  }) => JSXElement;
};

export function SubmitButton(
  props: {
    form: SubscribableForm;
    skipUnchangedCheck?: boolean;
  } & Omit<ButtonProps, "type">,
): JSXElement {
  const [local, others] = splitProps(props, ["disabled", "skipUnchangedCheck"]);
  return (
    <props.form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
        isValid: state.isValid,
        isDefaultValue: state.isDefaultValue,
      })}
      children={(state) => (
        <Button
          type="submit"
          {...others}
          disabled={
            (local.disabled ?? false) ||
            (!local.skipUnchangedCheck && state().isDefaultValue) ||
            !state().canSubmit ||
            state().isSubmitting ||
            !state().isValid
          }
        />
      )}
    />
  );
}
