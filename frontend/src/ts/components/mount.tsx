import { render } from "solid-js/web";
import { qsr } from "../utils/dom";
import { LiveStats } from "./test/LiveStats";
import { getAcc, getBurst, getWpm } from "../signals/test";

export function mountComponents(): void {
  render(
    () => <LiveStats mode="mini" wpm={getWpm} acc={getAcc} burst={getBurst} />,
    qsr("#liveStatsMini").native,
  );
  render(
    () => <LiveStats mode="text" wpm={getWpm} acc={getAcc} burst={getBurst} />,
    qsr("#liveStatsTextBottom").native,
  );
}
