import { AccountChart } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { format as dateFormat } from "date-fns/format";
import { createMemo, JSXElement, Show } from "solid-js";

import Config, { setConfig } from "../../../config";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { getConfig } from "../../../signals/config";
import { getTheme } from "../../../signals/theme";
import { blendTwoHexColors } from "../../../utils/colors";
import { Formatting } from "../../../utils/format";
import { findLineByLeastSquares } from "../../../utils/numbers";
import { TypingSpeedUnitSettings } from "../../../utils/typing-speed-units";
import { Button } from "../../common/Button";
import { ChartJs } from "../../common/ChartJs";

export function HistoryChart(props: {
  results: SnapshotResult<Mode>[];
  beginAtZero: boolean;
  typingSpeedUnit: TypingSpeedUnitSettings;
  format: Formatting;
}): JSXElement {
  const formatAccuracy = (accuracy: number): string =>
    props.format.accuracy(accuracy, { showDecimalPlaces: true });
  const formatSpeed = (wpm: number): string =>
    props.format.typingSpeed(wpm, { showDecimalPlaces: true });
  const wpm = createMemo(() =>
    props.results.map((it) => props.typingSpeedUnit.fromWpm(it.wpm)),
  );
  const acc = createMemo(() => props.results.map((it) => it.acc));

  const toggleAccountChart = (pos: number): (() => void) => {
    return () => {
      const newValue = [...Config.accountChart] as AccountChart;
      newValue[pos] = newValue[pos] === "on" ? "off" : "on";
      setConfig("accountChart", newValue);
    };
  };

  const colorIndex = (...val: boolean[]): number =>
    val.filter((it) => it).length;

  const datasetOptions = createMemo(() => {
    const wpmColors = [
      getTheme().main,
      blendTwoHexColors(getTheme().bg, getTheme().main, 0.4),
      blendTwoHexColors(getTheme().bg, getTheme().main, 0.2),
    ];
    const accColors = [
      getTheme().sub,
      blendTwoHexColors(getTheme().bg, getTheme().sub, 0.4),
      blendTwoHexColors(getTheme().bg, getTheme().sub, 0.2),
    ];

    const isSpeed = getConfig.accountChart[0] === "on";
    const isAcc = getConfig.accountChart[1] === "on";
    const isAvg10 = Config.accountChart[2] === "on";
    const isAvg100 = Config.accountChart[3] === "on";

    return {
      wpm: {
        yAxisID: "wpm",
        fill: false,
        borderWidth: 0,
        hidden: !isSpeed,
        pointBackgroundColor: wpmColors[colorIndex(isAvg10, isAvg100)],
        order: 3,
      },
      wpmAvg10: {
        yAxisID: "wpm",
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        hidden: !isSpeed || !isAvg10,
        borderColor: wpmColors[colorIndex(isAvg10, isAvg100) - 1],
        order: 2,
      },
      wpmAvg100: {
        yAxisID: "wpm",
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        hidden: !isSpeed || !isAvg100,
        borderColor: wpmColors[0],
        order: 1,
      },
      acc: {
        yAxisID: "acc",
        fill: false,
        pointStyle: "triangle",
        borderWidth: 0,
        pointRadius: 3.5,
        hidden: !isAcc,
        pointBackgroundColor: accColors[colorIndex(isAvg10, isAvg100)],
        order: 3,
      },
      accAvg10: {
        yAxisID: "acc",
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        hidden: !isAcc || !isAvg10,
        borderColor: accColors[colorIndex(isAvg10, isAvg100) - 1],
        order: 2,
      },
      accAvg100: {
        yAxisID: "acc",
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        hidden: !isAcc || !isAvg100,
        borderColor: accColors[0],
        order: 1,
      },
      pb: {
        yAxisID: "wpm",
        fill: false,
        stepped: true,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 4,
        hidden: !isSpeed,
        borderColor: blendTwoHexColors(getTheme().bg, getTheme().text, 0.2),
      },
    };
  });

  return (
    <>
      <div style={{ height: "400px" }}>
        <ChartJs
          type="line"
          data={{
            labels: props.results.map((_, i) => i),
            datasets: [
              {
                data: wpm(),
                ...datasetOptions().wpm,
              },
              {
                data: pb(wpm()),
                ...datasetOptions().pb,
              },
              {
                data: acc(),
                ...datasetOptions().acc,
              },
              {
                data: movingAverage(wpm(), 10),
                ...datasetOptions().wpmAvg10,
              },
              {
                data: movingAverage(acc(), 10),
                ...datasetOptions().accAvg10,
              },
              {
                data: movingAverage(wpm(), 100),
                ...datasetOptions().wpmAvg100,
              },
              {
                data: movingAverage(acc(), 100),
                ...datasetOptions().accAvg100,
              },
            ],
          }}
          options={{
            // responsive: true,
            maintainAspectRatio: false,
            hover: {
              mode: "nearest",
              intersect: false,
            },
            scales: {
              x: {
                axis: "x",
                type: "linear",
                reverse: true,
                min: 0,
                max: wpm().length - 1,
                display: false,
                grid: {
                  display: false,
                },
              },
              wpm: {
                axis: "y",
                type: "linear",
                beginAtZero: props.beginAtZero,
                ticks: {
                  stepSize: props.typingSpeedUnit.historyStepSize,
                },
                display: true,
                title: {
                  display: true,
                  text: props.typingSpeedUnit.fullUnitString,
                },
                position: "right",
              },
              acc: {
                axis: "y",
                beginAtZero: props.beginAtZero,
                min:
                  Config.accountChart[0] === "on"
                    ? 0
                    : Math.floor(Math.min(...acc()) / 5) * 5,
                max: 100,
                reverse: true,
                ticks: {
                  stepSize: 10,
                },
                display: true,
                title: {
                  display: true,
                  text: "Accuracy",
                },
                grid: {
                  display: false,
                },
                position: "left",
              },
            },

            plugins: {
              annotation: {
                annotations: [],
              },
              tooltip: {
                animation: { duration: 250 },
                // Disable the on-canvas tooltip
                enabled: true,

                intersect: false,
                external: function (ctx): void {
                  if (ctx === undefined) return;
                  ctx.tooltip.options.displayColors = false;
                },
                filter: function (tooltipItem): boolean {
                  return (
                    tooltipItem.datasetIndex !== 1 &&
                    tooltipItem.datasetIndex !== 3 &&
                    tooltipItem.datasetIndex !== 4 &&
                    tooltipItem.datasetIndex !== 5 &&
                    tooltipItem.datasetIndex !== 6
                  );
                },
                callbacks: {
                  title: function (): string {
                    return "";
                  },

                  beforeLabel: function (tooltipItem): string {
                    const result = props.results[tooltipItem.dataIndex];
                    if (result === undefined) return "unknown";

                    if (tooltipItem.datasetIndex !== 0) {
                      return `error rate: ${formatAccuracy(100 - result.acc)}\nacc: ${formatAccuracy(result.acc)}`;
                    }

                    let label =
                      `${getConfig.typingSpeedUnit}: ${formatSpeed(result.wpm)}` +
                      "\n" +
                      `raw: ${formatSpeed(result.rawWpm)}` +
                      "\n" +
                      `acc: ${formatAccuracy(result.acc)}` +
                      "\n\n" +
                      `mode: ${result.mode} `;

                    if (result.mode === "time") {
                      label += result.mode2;
                    } else if (result.mode === "words") {
                      label += result.mode2;
                    }

                    let diff = result.difficulty ?? "normal";
                    label += `\ndifficulty: ${diff}`;

                    label +=
                      "\n" +
                      `punctuation: ${result.punctuation}` +
                      "\n" +
                      `language: ${result.language}` +
                      `${result.isPb ? "\n\nnew personal best" : ""}` +
                      "\n\n" +
                      `date: ${dateFormat(
                        new Date(result.timestamp),
                        "dd MMM yyyy HH:mm",
                      )}`;

                    return label;
                  },

                  label: function (): string {
                    return "";
                  },
                  afterLabel: function (_tooltip): string {
                    //accountHistoryActiveIndex = tooltip.dataIndex;
                    return "";
                  },
                },
              },
            },
          }}
        />
      </div>
      <Trend results={props.results} />
      <div class="grid grid-cols-4 gap-2">
        <Button
          fa={{ icon: "fa-tachometer-alt", fixedWidth: true }}
          text="Speed"
          onClick={toggleAccountChart(0)}
          active={getConfig.accountChart[0] === "on"}
        />
        <Button
          fa={{ icon: "fa-bullseye", fixedWidth: true }}
          text="Accuracy"
          onClick={toggleAccountChart(1)}
          active={getConfig.accountChart[1] === "on"}
        />
        <Button
          fa={{ icon: "fa-chart-line", fixedWidth: true }}
          text="Avg of 10"
          onClick={toggleAccountChart(2)}
          active={getConfig.accountChart[2] === "on"}
        />
        <Button
          fa={{ icon: "fa-chart-line", fixedWidth: true }}
          text="Avg of 100"
          onClick={toggleAccountChart(3)}
          active={getConfig.accountChart[3] === "on"}
        />
      </div>
    </>
  );
}

function Trend(props: { results: SnapshotResult<Mode>[] }): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));

  const trend = createMemo(() => {
    const line = findLineByLeastSquares(
      props.results.map((it) => it.wpm).reverse(),
    );
    if (line === null) return undefined;

    const totalSecondsFiltered = props.results
      .map((it) => it.timeTyping)
      .reduce((acc, it) => acc + it, 0);

    const wpmChange = line[1][1] - line[0][1];
    const wpmChangePerHour = wpmChange * (3600 / totalSecondsFiltered);
    const plus = wpmChangePerHour > 0 ? "+" : "";

    return `Speed change per hour spent typing: ${plus}${format().typingSpeed(wpmChangePerHour, { showDecimalPlaces: true })} ${format().typingSpeedUnit}`;
  });

  return (
    <Show when={trend() !== undefined}>
      <div class="w-full text-center">{trend()}</div>
    </Show>
  );
}

function movingAverage(data: number[], windowSize: number): number[] {
  return data.map((_, i, array) => {
    const subset = array.slice(i, i + windowSize);

    if (subset.length === 0) return 0;

    const sum = subset.reduce((acc, value) => acc + value, 0);

    return sum / subset.length;
  });
}

function pb(data: number[]): number[] {
  const result = new Array<number>(data.length);
  let currentMax: number = -Infinity;

  for (let i = data.length - 1; i >= 0; i--) {
    const value = Number(data[i]);

    if (Number.isFinite(value)) {
      currentMax = Math.max(currentMax, value);
    }

    result[i] = currentMax;
  }

  return result;
}
