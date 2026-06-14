import { createMemo } from "solid-js";

import { getConfig } from "../../../config/store";
import { getLocalPB } from "../../../db";
import { getFormatting, isAuthenticated } from "../../../states/core";
import { getSnapshot } from "../../../states/snapshot";
import { getCurrentQuote } from "../../../states/test";
import { getActiveFunboxes } from "../../../test/funbox/list";
import { getMode2 } from "../../../utils/misc";
import { Notice } from "./Notice";

export function PbNotice() {
  const displayText = createMemo(() => {
    if (!isAuthenticated()) return "";
    const format = getFormatting();

    //react on config.funbox
    const _funbox = getConfig.funbox;
    //react on new localPB
    const _snapshot = getSnapshot();

    const mode2 = getMode2(getConfig, getCurrentQuote());
    const pb = getLocalPB(
      getConfig.mode,
      mode2,
      getConfig.punctuation,
      getConfig.numbers,
      getConfig.language,
      getConfig.difficulty,
      getConfig.lazyMode,
      getActiveFunboxes(),
    );

    if (pb === undefined) return "no pb";

    const speed = format.typingSpeed(pb.wpm, {
      showDecimalPlaces: true,
      suffix: ` ${getConfig.typingSpeedUnit}`,
    });

    const acc = format.accuracy(pb.acc, { suffix: ` acc` });

    return `${speed} ${acc}`;
  });

  return (
    <Notice
      when={isAuthenticated() && getConfig.showPb}
      icon="fa-crown"
      openCommandline="showPb"
      text={displayText()}
    />
  );
}
