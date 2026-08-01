import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import { hideModalAndClearChain } from "../../states/modals";
import * as PractiseWords from "../../test/practise-words";
import * as TestLogic from "../../test/test-logic";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Setting } from "../common/Setting";
import { ButtonGroup } from "../ui/form/ButtonGroup";

export function PractiseWordsModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      missed: "words" as "off" | "words" | "biwords",
      slow: false,
    },
    onSubmit: ({ value }) => {
      PractiseWords.init(value.missed, value.slow);
      hideModalAndClearChain("PractiseWords");
      void TestLogic.restart({ practiseMissed: true });
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
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div class="grid gap-8">
          <Setting
            showDeepLink={false}
            class="m-0 p-0"
            title="missed"
            fa={{ icon: "fa-times" }}
            description="Include missed words or biwords (which include the previous word)."
            breakpoints="none"
            inputs={
              <form.Field name="missed">
                {(field) => (
                  <ButtonGroup
                    field={field}
                    class="grid-cols-3"
                    options={[
                      { value: "off", label: "off" },
                      { value: "words", label: "words" },
                      { value: "biwords", label: "biwords" },
                    ]}
                  />
                )}
              </form.Field>
            }
          />

          <Setting
            showDeepLink={false}
            class="m-0 p-0"
            title="slow"
            fa={{ icon: "fa-tachometer-alt" }}
            description="Include words which you typed slower than others."
            breakpoints="none"
            inputs={
              <form.Field name="slow">
                {(field) => (
                  <ButtonGroup
                    field={field}
                    class="grid-cols-2"
                    options={[
                      { value: false, label: "off" },
                      { value: true, label: "on" },
                    ]}
                  />
                )}
              </form.Field>
            }
          />

          <Button type="submit" disabled={!canStart()}>
            start
          </Button>
        </div>
      </form>
    </AnimatedModal>
  );
}
