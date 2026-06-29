import { AnyFieldApi, createForm } from "@tanstack/solid-form";
import { For, JSXElement } from "solid-js";

import { hideModalAndClearChain } from "../../states/modals";
import * as PractiseWords from "../../test/practise-words";
import * as TestLogic from "../../test/test-logic";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Fa } from "../common/Fa";

export function PractiseWordsModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      missed: "words" as "off" | "words" | "biwords",
      slow: false,
    },
    onSubmit: ({ value }) => {
      PractiseWords.init(value.missed, value.slow);
      hideModalAndClearChain("PractiseWords");
      TestLogic.restart({ practiseMissed: true });
    },
  }));

  const canStart = form.useStore(
    (state) => state.values.missed !== "off" || state.values.slow,
  );

  return (
    <AnimatedModal
      id="PractiseWords"
      title="Practice words"
      modalClass="max-w-[400px]"
      animationMode="modalOnly"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div class="grid gap-8">
          <div class="grid gap-2">
            <div class="text-sub">
              <Fa icon="fa-times" /> missed
            </div>
            <div>
              Include missed words or biwords (which include the previous word).
            </div>
            <form.Field name="missed">
              {(field) => (
                <ButtonGroup
                  field={field}
                  options={[
                    { value: "off", label: "off" },
                    { value: "words", label: "words" },
                    { value: "biwords", label: "biwords" },
                  ]}
                  class="grid-cols-3"
                />
              )}
            </form.Field>
          </div>

          <div class="grid gap-2">
            <div class="text-sub">
              <Fa icon="fa-tachometer-alt" /> slow
            </div>
            <div>Include words which you typed slower than others.</div>
            <form.Field name="slow">
              {(field) => (
                <ButtonGroup
                  field={field}
                  options={[
                    { value: false, label: "off" },
                    { value: true, label: "on" },
                  ]}
                  class="grid-cols-2"
                />
              )}
            </form.Field>
          </div>

          <Button type="submit" disabled={!canStart()}>
            start
          </Button>
        </div>
      </form>
    </AnimatedModal>
  );
}

type ButtonGroupOption<T> = { value: T; label: string };

function ButtonGroup<T>(props: {
  field: () => AnyFieldApi;
  options: readonly ButtonGroupOption<T>[];
  class?: string;
}): JSXElement {
  return (
    <div class={cn("grid gap-2", props.class)}>
      <For each={props.options}>
        {(opt) => (
          <Button
            active={props.field().state.value === opt.value}
            onClick={() => props.field().handleChange(opt.value)}
          >
            {opt.label}
          </Button>
        )}
      </For>
    </div>
  );
}
