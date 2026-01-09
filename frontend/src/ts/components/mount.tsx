import { render } from "solid-js/web";
import { qsr } from "../utils/dom";
import {
  TextLiveStatsBottom,
  MiniLiveStats,
  TextLiveStatsTop,
} from "./test/LiveStats";
import { getAcc, getBurst, getProgress, getWpm } from "../signals/test";

export function mountComponents(): void {
  render(
    () => (
      <MiniLiveStats
        progress={getProgress}
        wpm={getWpm}
        acc={getAcc}
        burst={getBurst}
      />
    ),
    qsr("#liveStatsMini").native,
  );
  render(
    () => <TextLiveStatsBottom wpm={getWpm} acc={getAcc} burst={getBurst} />,
    qsr("#liveStatsTextBottom").native,
  );
  render(
    () => <TextLiveStatsTop progress={getProgress} />,
    qsr("#liveStatsTextTop").native,
  );
}
