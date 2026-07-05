import { createResource, createSignal, For, JSXElement, Show } from "solid-js";

import { Config } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { getTrainingFingers } from "../../states/finger-training";
import { hideModalAndClearChain, isModalOpen } from "../../states/modals";
import * as FingerTraining from "../../test/finger-training";
import {
  FingerDisplayNames,
  FingerName,
  FingerNames,
  getFingerLetters,
  resolveLayoutName,
} from "../../utils/fingers";
import { getLayout } from "../../utils/json-data";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Slider } from "../common/Slider";

// module level so the selection is kept while the page is open
const [selectedFingers, setSelectedFingers] = createSignal<FingerName[]>([]);
const [frequency, setFrequency] = createSignal(1);

const frequencyLabels: Record<number, string> = {
  1: "every word",
  2: "every 2nd word",
  3: "every 3rd word",
};

export function FingerTrainingModal(): JSXElement {
  const [starting, setStarting] = createSignal(false);

  const [fingerLetters, { refetch: refetchFingerLetters }] = createResource(
    // only fetch once the modal has been opened, not at app boot
    () =>
      isModalOpen("FingerTraining")
        ? resolveLayoutName(Config.layout)
        : undefined,
    async (layoutName) => getFingerLetters(await getLayout(layoutName)),
  );

  const lettersFor = (finger: FingerName): string =>
    fingerLetters.state === "ready" ? fingerLetters()[finger].join(" ") : "...";

  const toggleFinger = (finger: FingerName): void => {
    setSelectedFingers((current) =>
      current.includes(finger)
        ? current.filter((f) => f !== finger)
        : [...current, finger],
    );
  };

  const start = async (): Promise<void> => {
    if (starting()) return;
    setStarting(true);
    const started = await FingerTraining.init(selectedFingers(), frequency());
    setStarting(false);
    if (started) {
      // clear the whole chain so closing does not bring the commandline back
      hideModalAndClearChain("FingerTraining");
      restartTestEvent.dispatch({});
    }
  };

  const stopTraining = (): void => {
    if (FingerTraining.stop()) {
      hideModalAndClearChain("FingerTraining");
      restartTestEvent.dispatch({});
    }
  };

  const hand = (fingers: FingerName[], title: string): JSXElement => (
    <div class="grid gap-2">
      <div class="text-center text-sub">{title}</div>
      <div class="grid grid-cols-4 gap-2">
        <For each={fingers}>
          {(finger) => (
            <Button
              active={selectedFingers().includes(finger)}
              onClick={() => toggleFinger(finger)}
              class="flex-col gap-1 py-3"
            >
              <div>{FingerDisplayNames[finger]}</div>
              <div class="text-xs opacity-60">{lettersFor(finger)}</div>
            </Button>
          )}
        </For>
      </div>
    </div>
  );

  return (
    <AnimatedModal
      id="FingerTraining"
      title="Finger training"
      modalClass="max-w-2xl"
      beforeShow={() => {
        // a failed layout fetch would otherwise leave the letters stuck
        if (fingerLetters.error !== undefined) void refetchFingerLetters();
      }}
    >
      <div class="grid gap-4">
        <p class="text-sub">
          Pick the fingers you want to train. Tests will still use normal words,
          but ones that exercise the selected fingers will show up
          disproportionately more. Training stays active across restarts - stop
          it here (or change the mode) to go back to your usual settings.
        </p>
        <div class="grid grid-cols-2 gap-8">
          {hand(FingerNames.slice(0, 4), "left hand")}
          {hand(FingerNames.slice(4), "right hand")}
        </div>
        <div class="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <div class="text-sub">training word frequency</div>
          <Slider
            min={1}
            max={3}
            step={1}
            value={frequency()}
            onEveryChange={(value) => setFrequency(value)}
            text={(value) => `1/${value}`}
          />
          <div class="text-sub">{frequencyLabels[frequency()]}</div>
        </div>
        <Button
          class="w-full"
          disabled={selectedFingers().length === 0 || starting()}
          onClick={() => void start()}
        >
          start training
        </Button>
        <Show when={getTrainingFingers().length > 0}>
          <Button class="w-full" onClick={stopTraining}>
            stop training
          </Button>
        </Show>
      </div>
    </AnimatedModal>
  );
}
