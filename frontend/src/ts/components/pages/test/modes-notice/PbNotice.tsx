import { createMemo } from "solid-js";

import { getLocalPB, getUserData } from "../../../../queries/user";
import { getFormatting, isAuthenticated } from "../../../../states/core";
import { getCurrentQuote } from "../../../../states/test";
import { testConfigView as config } from "../../../../states/test-config-view";
import { get as getFunboxes } from "../../../../test/funbox/list";
import { getMode2 } from "../../../../utils/misc";
import { Notice } from "./Notice";

export function PbNotice() {
  const displayText = createMemo(() => {
    if (!isAuthenticated()) return "";
    const format = getFormatting();

    //react on new localPB
    const _userData = getUserData();

    const mode2 = getMode2(config, getCurrentQuote());
    const pb = getLocalPB(
      config.mode,
      mode2,
      config.punctuation,
      config.numbers,
      config.language,
      config.difficulty,
      config.lazyMode,
      getFunboxes(config.funbox),
    );

    if (pb === undefined) return "no pb";

    const speed = format.typingSpeed(pb.wpm, {
      showDecimalPlaces: true,
      suffix: ` ${config.typingSpeedUnit}`,
    });

    const acc = format.accuracy(pb.acc, { suffix: ` acc` });

    return `${speed} ${acc}`;
  });

  return (
    <Notice
      when={isAuthenticated() && config.showPb}
      icon="fa-crown"
      openCommandline="showPb"
      text={displayText()}
    />
  );
}
