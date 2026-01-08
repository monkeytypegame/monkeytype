import { createMemo } from "solid-js";
import { qsr } from "../utils/dom";
import { LiveCounter } from "./live-counter";
import { render } from "solid-js/web";
import { getAcc, getBurst, getWpm } from "../signals/live-states";
import {
  getLiveAccStyle,
  getLiveBurstStyle,
  getLiveSpeedStyle,
} from "../signals/config";
import { isActive } from "./test-state";
import { isFocused } from "./focus";

const isTestRunning = createMemo(() => isActive() && isFocused());

const liveWpmText = createMemo(() =>
  isTestRunning() && getLiveSpeedStyle() === "text" ? getWpm() : "",
);
const liveWpmMini = createMemo(() =>
  isTestRunning() && getLiveSpeedStyle() === "mini" ? getWpm() : "",
);
const liveAccText = createMemo(() =>
  isTestRunning() && getLiveAccStyle() === "text" ? getAcc() : "",
);
const liveAccMini = createMemo(() =>
  isTestRunning() && getLiveAccStyle() === "mini" ? getAcc() : "",
);
const liveBurstText = createMemo(() =>
  isTestRunning() && getLiveBurstStyle() === "text" ? getBurst() : "",
);
const liveBurstMini = createMemo(() =>
  isTestRunning() && getLiveBurstStyle() === "mini" ? getBurst() : "",
);

export function mountLiveCounters(): void {
  const textWrapper = qsr("#liveStatsTextBottom");
  render(
    () => (
      <div class="wrapper">
        <LiveCounter class="liveSpeed" value={liveWpmText} />
        <LiveCounter class="liveAcc" value={liveAccText} />
        <LiveCounter class="liveBurst" value={liveBurstText} />
      </div>
    ),
    textWrapper.native,
  );

  const miniWrapper = qsr("#liveStatsMini");
  render(
    () => (
      <div>
        <LiveCounter class="speed" value={liveWpmMini} />
        <LiveCounter class="acc" value={liveAccMini} />
        <LiveCounter class="burst" value={liveBurstMini} />
      </div>
    ),
    miniWrapper.native,
  );
}
