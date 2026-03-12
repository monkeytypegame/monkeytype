import type { AnyFieldApi } from "@tanstack/solid-form";

import { Match, Switch } from "solid-js";

import { Balloon } from "../../common/Balloon";
import { Fa } from "../../common/Fa";
import { LoadingCircle } from "../../common/LoadingCircle";

export type FieldIndicatorProps = {
  field: AnyFieldApi;
};

export function FieldIndicator(props: FieldIndicatorProps) {
  //@ts-expect-error custom meta attributes
  const hasWarning = () => props.field.getMeta().hasWarning as boolean;
  //@ts-expect-error custom meta attributes
  const getWarnings = () => props.field.getMeta().warnings as string[];
  return (
    <div class="col-start-1 row-start-1 self-center justify-self-end pr-[0.40em]">
      <Switch>
        <Match when={props.field.state.meta.isValidating}>
          <LoadingCircle />
        </Match>
        <Match
          when={
            props.field.state.meta.isTouched && !props.field.state.meta.isValid
          }
        >
          <Balloon
            position="left"
            length="large"
            text={props.field.state.meta.errors.join(", ")}
          >
            <Fa icon="fa-times" class="text-error" fixedWidth />
          </Balloon>
        </Match>
        <Match when={hasWarning()}>
          <Balloon
            position="left"
            length="large"
            text={getWarnings().join(", ")}
          >
            <Fa icon="fa-exclamation-triangle" class="text-main" />
          </Balloon>
        </Match>
        <Match
          when={
            props.field.state.meta.isTouched &&
            props.field.state.meta.isValid &&
            !props.field.state.meta.isDefaultValue
          }
        >
          <Fa icon="fa-check" class="text-main" fixedWidth />
        </Match>
      </Switch>
    </div>
  );
}
