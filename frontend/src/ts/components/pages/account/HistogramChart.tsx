import { Mode } from "@monkeytype/schemas/shared";
import { createMemo, JSXElement } from "solid-js";

import { SnapshotResult } from "../../../constants/default-snapshot";
import { getTheme } from "../../../signals/theme";
import { TypingSpeedUnitSettings } from "../../../utils/typing-speed-units";
import { ChartJs } from "../../common/ChartJs";

export function HistogramChart(props: {
  results: SnapshotResult<Mode>[];
  typingSpeedUnit: TypingSpeedUnitSettings;
}): JSXElement {
  const buckets = createMemo(() =>
    groupIntoBuckets(
      props.results.map((it) => props.typingSpeedUnit.fromWpm(it.wpm)),
      props.typingSpeedUnit.histogramDataBucketSize,
    ),
  );

  return (
    <div style={{ height: "200px" }}>
      <ChartJs
        type="bar"
        data={{
          datasets: [
            {
              label: "Tests",
              data: buckets(),
              backgroundColor: getTheme().main,
              borderColor: getTheme().main,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          hover: {
            mode: "nearest",
            intersect: false,
          },
          scales: {
            x: {
              axis: "x",
              bounds: "ticks",
              display: true,
              title: {
                display: false,
                text: "Bucket",
              },
            },
            count: {
              axis: "y",
              beginAtZero: true,
              ticks: {
                autoSkip: true,
                autoSkipPadding: 20,
                stepSize: 10,
              },
              display: true,
              title: {
                display: true,
                text: "Tests",
              },
            },
          },
          plugins: {
            annotation: {
              annotations: [],
            },
            tooltip: {
              animation: { duration: 250 },
              intersect: false,
              mode: "index",
            },
          },
        }}
      />
    </div>
  );
}

function groupIntoBuckets(
  arr: number[],
  bucketSize: number,
): { x: string; y: number }[] {
  const buckets: Record<string, number> = {};

  for (const item of arr) {
    const bucketStart = Math.floor(item / bucketSize) * bucketSize;
    const bucketEnd = bucketStart + bucketSize - 1;
    const label = `${bucketStart}-${bucketEnd}`;

    buckets[label] = (buckets[label] ?? 0) + 1;
  }

  console.log("### buckets", buckets);

  const result = Object.entries(buckets)
    .sort(([a], [b]) => {
      const startA = Number(a.split("-")[0]);
      const startB = Number(b.split("-")[0]);
      return startA - startB;
    })
    .map(([x, y]) => ({ x, y }));
  console.log("### results", result);
  return result;
}
