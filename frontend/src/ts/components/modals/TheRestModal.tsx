import { createEffect, createSignal, For, JSXElement, Show } from "solid-js";
import { z } from "zod";

import {
  fpsLimitSchema,
  getfpsLimit,
  resetFpsLimit,
  setfpsLimit,
} from "../../anim";
import {
  getGlarsesMode,
  resetGlarsesMode,
  setGlarsesMode,
} from "../../states/glarses-mode";
import {
  getSmoothedBurst,
  resetSmoothedBurst,
  setSmoothedBurst,
} from "../../states/result";
import {
  getSarcasticResultMessage,
  resetSarcasticResultMessage,
  setSarcasticResultMessage,
} from "../../states/sarcastic-result-message";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Balloon } from "../common/Balloon";
import { Button } from "../common/Button";
import { Fa } from "../common/Fa";

type SettingValue = string | number | boolean;

type SettingDefinition = {
  name: string;
  description?: string;
  get: () => SettingValue;
  set: (value: SettingValue) => void;
  reset: () => void;
  /** optional validation, rejected input is not committed */
  schema?: z.ZodType<SettingValue>;
};

// erases the value type so differently typed settings can live in one array,
// while keeping get/set/schema checked against each other at the call site
function defineSetting<T extends SettingValue>(definition: {
  name: string;
  description?: string;
  get: () => T;
  set: (value: T) => void;
  reset: () => void;
  schema?: z.ZodType<T>;
}): SettingDefinition {
  return {
    ...(definition ?? {}),
    set: (value) => definition.set(value as T),
  };
}

const settings: SettingDefinition[] = [
  defineSetting({
    name: "sarcastic result message",
    description:
      "When achieving 0 wpm, a sarcastic joke message will be shown.",
    get: getSarcasticResultMessage,
    set: setSarcasticResultMessage,
    reset: resetSarcasticResultMessage,
  }),
  defineSetting({
    name: "glarses mode",
    description:
      "Hides the entire result screen, showing only a checkmark. The stats are logged to the browser console instead.",
    get: getGlarsesMode,
    set: setGlarsesMode,
    reset: resetGlarsesMode,
  }),
  defineSetting({
    name: "smoothed burst",
    description:
      "Smooths out the burst line on the result chart. Turning this off shows the raw per-word burst values.",
    get: getSmoothedBurst,
    set: setSmoothedBurst,
    reset: resetSmoothedBurst,
  }),
  defineSetting({
    name: "animation fps limit",
    get: getfpsLimit,
    set: setfpsLimit,
    reset: resetFpsLimit,
    schema: fpsLimitSchema,
  }),
];

export function TheRestModal(): JSXElement {
  return (
    <AnimatedModal id="TheRest" modalClass="max-w-2xl">
      <div class="flex items-center justify-between gap-4">
        <div class="text-2xl text-sub">The rest</div>
        <Button
          text="reset to default"
          fa={{ icon: "fa-undo" }}
          onClick={() => {
            for (const setting of settings) {
              setting.reset();
            }
          }}
        />
      </div>
      <div class="grid gap-4">
        <For each={settings}>{(setting) => <Setting setting={setting} />}</For>
      </div>
    </AnimatedModal>
  );
}

function Setting(props: { setting: SettingDefinition }): JSXElement {
  const [invalid, setInvalid] = createSignal(false);
  const value = (): SettingValue => props.setting.get();

  // a rejected commit leaves the value untouched, so this only runs when the
  // value actually changed - including from the outside, like a reset
  createEffect(() => {
    value();
    setInvalid(false);
  });

  const commit = (newValue: SettingValue): void => {
    if (typeof newValue === "number" && isNaN(newValue)) {
      setInvalid(true);
      return;
    }
    const schema = props.setting.schema;
    if (schema !== undefined && !schema.safeParse(newValue).success) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    props.setting.set(newValue);
  };

  return (
    <div class="grid grid-cols-[auto_1fr_10rem] items-center gap-2">
      <div>{props.setting.name}</div>
      <Show
        when={props.setting.description !== undefined}
        fallback={<div></div>}
      >
        <Balloon
          text={props.setting.description}
          length="large"
          break
          class="text-sub"
        >
          <Fa icon="fa-info-circle" />
        </Balloon>
      </Show>
      <Show
        when={typeof value() === "boolean"}
        fallback={
          <input
            class={cn(
              "w-full rounded border-none bg-sub-alt p-[0.5em] text-em-base leading-[1.25em] caret-main outline-none",
              "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
              invalid() && "text-error",
            )}
            type={typeof value() === "number" ? "number" : "text"}
            value={String(value())}
            onInput={() => setInvalid(false)}
            onBlur={(e) => {
              commit(
                typeof value() === "number"
                  ? parseFloat(e.currentTarget.value)
                  : e.currentTarget.value,
              );
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        }
      >
        <div class="grid grid-cols-2 gap-2">
          <Button
            text="off"
            active={value() === false}
            onClick={() => commit(false)}
          />
          <Button
            text="on"
            active={value() === true}
            onClick={() => commit(true)}
          />
        </div>
      </Show>
    </div>
  );
}
