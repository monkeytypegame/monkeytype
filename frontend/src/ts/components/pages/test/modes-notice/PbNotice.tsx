import { createMemo } from "solid-js";

import { isAuthenticated } from "../../../../auth/state";
import { getConfig } from "../../../../config/store";
import { getLocalPB, getUserData } from "../../../../queries/user";
import { getCurrentQuote } from "../../../../states/test";
import { getActiveFunboxes } from "../../../../test/funbox/list";
import { formatAccuracy, formatTypingSpeed } from "../../../../utils/format";
import { getMode2 } from "../../../../utils/misc";
import { Notice } from "./Notice";

export function PbNotice() {
  const displayText = createMemo(() => {
    if (!isAuthenticated()) return "";

    //react on new localPB
    const _userData = getUserData();

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

    const speed = formatTypingSpeed(pb.wpm, {
      showDecimalPlaces: true,
      suffix: ` ${getConfig.typingSpeedUnit}`,
    });

    const acc = formatAccuracy(pb.acc, { suffix: ` acc` });

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
