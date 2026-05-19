import { createMemo, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getLocalPB } from "../../../db";
import { isAuthenticated } from "../../../states/core";
import { getSnapshot } from "../../../states/snapshot";
import { getCurrentQuote } from "../../../states/test";
import { getActiveFunboxes } from "../../../test/funbox/list";
import { Formatting } from "../../../utils/format";
import { getMode2 } from "../../../utils/misc";
import { Notice } from "./Notice";

export function PbNotice() {
  const format = createMemo(() => new Formatting(getConfig));
  const pb = createMemo(() => {
    if (!isAuthenticated()) return undefined;

    //react on config.funbox
    const _funbox = getConfig.funbox;
    //react on new localPB
    const _snapshot = getSnapshot();

    const mode2 = getMode2(getConfig, getCurrentQuote());
    return getLocalPB(
      getConfig.mode,
      mode2,
      getConfig.punctuation,
      getConfig.numbers,
      getConfig.language,
      getConfig.difficulty,
      getConfig.lazyMode,
      getActiveFunboxes(),
    );
  });
  return (
    <Notice
      when={isAuthenticated() && getConfig.showPb}
      icon="fa-crown"
      openCommandline="showPb"
    >
      <Show when={pb() !== undefined} fallback="no pb">
        {format().typingSpeed(pb()?.wpm, {
          showDecimalPlaces: true,
          suffix: ` ${getConfig.typingSpeedUnit}`,
        })}{" "}
        {format().accuracy(pb()?.acc, {
          suffix: ` acc`,
        })}
      </Show>
    </Notice>
  );
}
