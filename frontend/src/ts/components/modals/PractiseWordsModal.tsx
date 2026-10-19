import { JSXElement, ParentProps, createSignal } from "solid-js";

import { hideModalAndClearChain } from "../../states/modals";
import * as PractiseWords from "../../test/practise-words";
import * as TestLogic from "../../test/test-logic";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { FaProps } from "../common/Fa";
import { H3 } from "../common/Headers";

type Missed = "off" | "words" | "biwords";

export function PractiseWordsModal(): JSXElement {
  const [missed, setMissed] = createSignal<Missed>("words");
  const [slow, setSlow] = createSignal(false);

  const canStart = (): boolean => missed() !== "off" || slow();

  const apply = (): void => {
    if (!canStart()) return;
    PractiseWords.init(missed(), slow());
    hideModalAndClearChain("PractiseWords");
    void TestLogic.restart({
      practiseMissed: true,
    });
  };

  return (
    <AnimatedModal
      id="PractiseWords"
      title="Practice words"
      modalClass="max-w-[400px]"
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          apply();
        }}
      >
        <Group
          title="missed"
          fa={{ icon: "fa-times" }}
          description="Include missed words or biwords (which include the previous word)."
        >
          <Button
            text="off"
            class="grow"
            active={missed() === "off"}
            onClick={() => setMissed("off")}
          />
          <Button
            text="words"
            class="grow"
            active={missed() === "words"}
            onClick={() => setMissed("words")}
          />
          <Button
            text="biwords"
            class="grow"
            active={missed() === "biwords"}
            onClick={() => setMissed("biwords")}
          />
        </Group>

        <Group
          title="slow"
          fa={{ icon: "fa-tachometer-alt" }}
          description="Include words which you typed slower than others."
        >
          <Button
            text="off"
            class="grow"
            active={!slow()}
            onClick={() => setSlow(false)}
          />
          <Button
            text="on"
            class="grow"
            active={slow()}
            onClick={() => setSlow(true)}
          />
        </Group>

        <Button type="submit" text="start" disabled={!canStart()} />
      </form>
    </AnimatedModal>
  );
}

function Group(
  props: ParentProps<{
    title: string;
    fa: FaProps;
    description: string;
  }>,
): JSXElement {
  return (
    <div class="grid gap-2">
      <H3 text={props.title} fa={props.fa} class="pb-0" />
      <div>{props.description}</div>
      <div class="flex gap-2">{props.children}</div>
    </div>
  );
}
