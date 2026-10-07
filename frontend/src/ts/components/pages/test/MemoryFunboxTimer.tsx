import {
  createEffect,
  createSignal,
  JSXElement,
  on,
  onCleanup,
} from "solid-js";

import {
  getMemoryTimerDuration,
  setMemoryTimerDuration,
  setWordsWrapperHidden,
} from "../../../states/test";
import { FunboxTimer } from "./FunboxTimer";

export function MemoryFunboxTimer(): JSXElement {
  const [remaining, setRemaining] = createSignal(0);

  createEffect(
    on(getMemoryTimerDuration, (duration) => {
      if (duration === null) {
        setRemaining(0);
        return;
      }
      setRemaining(duration);
      const interval = setInterval(() => {
        setRemaining((prev) => prev - 1);
        if (remaining() <= 0) {
          setMemoryTimerDuration(null);
          setWordsWrapperHidden(true);
        }
      }, 1000);
      onCleanup(() => clearInterval(interval));
    }),
  );

  return (
    <FunboxTimer
      id="memoryTimer"
      visible={remaining() > 0}
      text={`Time left to memorise all words: ${remaining()}s`}
      animated={false} //not animated because the restart animation will take care of it
    />
  );
}
