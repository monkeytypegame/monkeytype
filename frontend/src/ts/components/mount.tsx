import { render } from "solid-js/web";
import { qsr } from "../utils/dom";
import { LiveStats, LiveStatsMini } from "./test/LiveStats";
import { getAcc, getBurst, getWpm } from "../signals/test";

export function mountComponents(): void {
  render(
    () => <LiveStatsMini wpm={getWpm} acc={getAcc} burst={getBurst} />,
    qsr("#liveStatsMini").native,
  );
  render(
    () => <LiveStats wpm={getWpm} acc={getAcc} burst={getBurst} />,
    qsr("#liveStatsTextBottom").native,
  );
}
