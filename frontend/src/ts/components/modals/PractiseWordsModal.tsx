import { createSignal, JSXElement } from "solid-js";

import { hideModalAndClearChain } from "../../states/modals";
import * as PractiseWords from "../../test/practise-words";
import * as TestLogic from "../../test/test-logic";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Fa } from "../common/Fa";

export function PractiseWordsModal(): JSXElement {
  const [missed, setMissed] = createSignal<"off" | "words" | "biwords">(
    "words",
  );
  const [slow, setSlow] = createSignal(false);

  const canStart = (): boolean => missed() !== "off" || slow();

  const apply = (): void => {
    PractiseWords.init(missed(), slow());
    hideModalAndClearChain("PractiseWords");
    TestLogic.restart({ practiseMissed: true });
  };

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
          apply();
        }}
      >
        <div class="grid gap-4">
          <div class="grid w-full gap-2">
            <div class="text-sm text-sub lowercase">
              <Fa icon="fa-times" /> missed
            </div>
            <div class="text-sm text-text">
              Include missed words or biwords (which include the previous word).
            </div>
            <div class="flex gap-2">
              <Button
                active={missed() === "off"}
                onClick={() => setMissed("off")}
                class="flex-1"
              >
                off
              </Button>
              <Button
                active={missed() === "words"}
                onClick={() => setMissed("words")}
                class="flex-1"
              >
                words
              </Button>
              <Button
                active={missed() === "biwords"}
                onClick={() => setMissed("biwords")}
                class="flex-1"
              >
                biwords
              </Button>
            </div>
          </div>

          <div class="grid w-full gap-2">
            <div class="text-sm text-sub lowercase">
              <Fa icon="fa-tachometer-alt" /> slow
            </div>
            <div class="text-sm text-text">
              Include words which you typed slower than others.
            </div>
            <div class="flex gap-2">
              <Button
                active={!slow()}
                onClick={() => setSlow(false)}
                class="flex-1"
              >
                off
              </Button>
              <Button
                active={slow()}
                onClick={() => setSlow(true)}
                class="flex-1"
              >
                on
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={!canStart()}>
            start
          </Button>
        </div>
      </form>
    </AnimatedModal>
  );
}
