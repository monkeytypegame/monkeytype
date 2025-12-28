import { Chart, ChartConfiguration, ChartDataset } from "chart.js";
import * as TribeState from "./tribe-state";
import * as ThemeColors from "../elements/theme-colors";
import * as Notifications from "../elements/notifications";
import { createErrorMessage } from "../utils/misc";
import tribeSocket from "./tribe-socket";
import { blendTwoHexColors } from "../utils/colors";
import { smoothWithValueWindow } from "../utils/arrays";
import Config from "../config";
import * as TestStats from "../test/test-stats";

const charts: Record<string, Chart> = {};

const settings: ChartConfiguration = {
  type: "line",
  data: {
    labels: [1, 2, 3],
    datasets: [
      {
        //@ts-expect-error the type is defined incorrectly, have to ignore the error
        clip: false,
        label: "wpm",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "wpm",
        order: 2,
        pointRadius: 1,
        tension: 0.5,
        fill: "origin",
      },
      {
        //@ts-expect-error the type is defined incorrectly, have to ignore the error
        clip: false,
        label: "burst",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "burst",
        order: 4,
        pointRadius: 1,
        tension: 0.5,
        fill: "origin",
      },
      {
        //@ts-expect-error the type is defined incorrectly, have to ignore the error
        clip: false,
        label: "errors",
        data: [],
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 2,
        order: 1,
        yAxisID: "error",
        type: "scatter",
        pointStyle: "crossRot",
        pointRadius: function (context): number {
          const index = context.dataIndex;
          const value = context.dataset.data[index] as number;
          return (value ?? 0) <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context): number {
          const index = context.dataIndex;
          const value = context.dataset.data[index] as number;
          return (value ?? 0) <= 0 ? 0 : 5;
        },
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    layout: {
      padding: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5,
      },
    },
    // tooltips: {
    //   titleFontFamily: "Roboto Mono",
    //   bodyFontFamily: "Roboto Mono",
    //   mode: "index",
    //   intersect: false,
    //   enabled: false,
    //   custom: function (tooltipModel: unknown) {
    //     // Tooltip Element
    //     let tooltipEl = document.getElementById("tribeMiniChartCustomTooltip");

    //     // Create element on first render
    //     if (!tooltipEl) {
    //       tooltipEl = document.createElement("div");
    //       tooltipEl.id = "tribeMiniChartCustomTooltip";
    //       tooltipEl.innerHTML = "<div></div>";
    //       document.body.appendChild(tooltipEl);
    //     }

    //     // Hide if no tooltip
    //     if (tooltipModel.opacity === 0) {
    //       tooltipEl.style.opacity = "0";
    //       return;
    //     }

    //     // Set caret Position
    //     tooltipEl.classList.remove("above", "below", "no-transform");
    //     if (tooltipModel.yAlign) {
    //       tooltipEl.classList.add(tooltipModel.yAlign);
    //     } else {
    //       tooltipEl.classList.add("no-transform");
    //     }

    //     function getBody(bodyItem) {
    //       return bodyItem.lines;
    //     }

    //     // Set Text
    //     if (tooltipModel.body) {
    //       const titleLines = tooltipModel.title || [];
    //       const bodyLines = tooltipModel.body.map(getBody);

    //       let innerHtml = "";

    //       titleLines.forEach(function (title: string) {
    //         innerHtml += "<div>" + title + "</div>";
    //       });
    //       // innerHtml += '</thead><tbody>';

    //       bodyLines.forEach(function (body, _i) {
    //         // var colors = tooltipModel.labelColors[i];
    //         // var style = 'background:' + colors.backgroundColor;
    //         // style += '; border-color:' + colors.borderColor;
    //         // style += '; border-width: 2px';
    //         // var span = '<span style="' + style + '"></span>';
    //         innerHtml += "<div>" + body + "</div>";
    //         // innerHtml += '<tr><td>' + span + body + '</td></tr>';
    //       });
    //       // innerHtml += '</tbody>';

    //       const tableRoot = tooltipEl.querySelector("div");
    //       tableRoot.innerHTML = innerHtml;
    //     }

    //     // `this` will be the overall tooltip
    //     const position = this._chart.canvas.getBoundingClientRect();

    //     // Display, position, and set styles for font
    //     tooltipEl.style.opacity = "1";
    //     tooltipEl.style.position = "absolute";
    //     tooltipEl.style.left =
    //       position.left +
    //       window.pageXOffset +
    //       tooltipModel.caretX -
    //       tooltipEl.offsetWidth +
    //       "px";
    //     tooltipEl.style.top =
    //       position.top + window.pageYOffset + tooltipModel.caretY + "px";
    //     // tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
    //     tooltipEl.style.fontSize = "0.75rem";
    //     tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
    //     tooltipEl.style.padding =
    //       tooltipModel.yPadding + "px " + tooltipModel.xPadding + "px";
    //     tooltipEl.style.pointerEvents = "none";
    //     tooltipEl.style.background = "rgba(0,0,0,.75)";
    //     tooltipEl.style.borderRadius = "0.5rem";
    //     tooltipEl.style.color = "white";
    //     tooltipEl.style.zIndex = "999";
    //     tooltipEl.style.transition = "left 0.25s, top 0.25s, opacity 0.25s";
    //   },
    // },
    // legend: {
    //   display: false,
    //   labels: {
    //     defaultFontFamily: "Roboto Mono",
    //   },
    // },
    scales: {
      x: {
        axis: "x",
        ticks: {
          // fontFamily: "Roboto Mono",
          autoSkip: true,
          autoSkipPadding: 40,
          display: false,
        },
        display: true,
        // scaleLabel: {
        //   display: false,
        //   labelString: "Seconds",
        //   fontFamily: "Roboto Mono",
        // },
        grid: {
          display: true,
          drawTicks: false,
          tickLength: 0,
        },
      },
      wpm: {
        min: 0,
        axis: "y",
        display: true,
        // scaleLabel: {
        //   display: false,
        //   labelString: "Words per Minute",
        //   fontFamily: "Roboto Mono",
        // },
        ticks: {
          // fontFamily: "Roboto Mono",
          // beginAtZero: true,
          // min: 0,
          autoSkip: true,
          autoSkipPadding: 40,
          display: false,
        },
        grid: {
          display: true,
          drawTicks: false,
          // tickMarkLength: 0,
        },
      },
      burst: {
        min: 0,
        axis: "y",
        display: false,
        // scaleLabel: {
        //   display: true,
        //   labelString: "Raw Words per Minute",
        //   fontFamily: "Roboto Mono",
        // },
        ticks: {
          // fontFamily: "Roboto Mono",
          // beginAtZero: true,
          // min: 0,
          autoSkip: true,
          autoSkipPadding: 40,
        },
        grid: {
          display: false,
        },
      },
      error: {
        min: 0,
        axis: "y",
        display: false,
        position: "right",
        // scaleLabel: {
        //   display: true,
        //   labelString: "Errors",
        //   fontFamily: "Roboto Mono",
        // },
        ticks: {
          // precision: 0,
          // fontFamily: "Roboto Mono",
          // beginAtZero: true,
          autoSkip: true,
          autoSkipPadding: 40,
        },
        grid: {
          display: false,
        },
      },
    },
  },
};

async function fillData(chart: Chart, userId: string): Promise<void> {
  const labels: number[] = [];
  const room = TribeState.getRoom();
  if (!room) return;
  const result = room.users[userId]?.result;
  if (!result) return;

  for (let i = 1; i <= result.chartData.wpm.length; i++) {
    labels.push(i);
  }

  // const bgcolor = await ThemeColors.get("bg");
  const subcolor = await ThemeColors.get("sub");
  const subaltcolor = await ThemeColors.get("subAlt");
  const maincolor = await ThemeColors.get("main");
  const errorcolor = await ThemeColors.get("error");
  const textcolor = await ThemeColors.get("text");
  const gridcolor = subaltcolor;

  for (const scale of Object.values(chart.options.scales ?? {})) {
    //@ts-expect-error tribe
    scale.grid.color = gridcolor;
    //@ts-expect-error tribe
    scale.grid.tickColor = gridcolor;
    //@ts-expect-error tribe
    scale.grid.borderColor = gridcolor;
    //@ts-expect-error tribe
    scale.ticks.color = subcolor;
    //@ts-expect-error tribe
    // oxlint-disable-next-line no-unsafe-member-access
    scale.title.color = subcolor;
  }

  const wpmToShow = [...result.chartData.wpm];
  const burstToShow = [...result.chartData.burst];
  const errToShow = [...result.chartData.err];

  const valueWindow = Math.max(...burstToShow) * 0.25;
  const smoothedBurst = smoothWithValueWindow(burstToShow, 1, valueWindow);

  if (
    Config.mode !== "time" &&
    TestStats.lastSecondNotRound &&
    result.testDuration % 1 < 0.5
  ) {
    labels.pop();
    wpmToShow.pop();
    errToShow.pop();
  }

  const c = chart as unknown as typeof settings;

  c.data.labels = labels;
  //@ts-expect-error tribe
  c.data.datasets[0].data = wpmToShow;

  //@ts-expect-error tribe
  chart.data.datasets[1].data = smoothedBurst;
  //@ts-expect-error tribe
  chart.data.datasets[2].data = errToShow;

  const wpm = chart.data.datasets[0] as ChartDataset;
  const burst = chart.data.datasets[1] as ChartDataset;
  const err = chart.data.datasets[2] as ChartDataset;

  wpm.backgroundColor = "transparent";
  if (userId === tribeSocket.getId()) {
    wpm.borderColor = maincolor;
    //@ts-expect-error tribe
    wpm.pointBackgroundColor = maincolor;
    //@ts-expect-error tribe
    wpm.pointBorderColor = maincolor;
  } else {
    wpm.borderColor = textcolor;
    //@ts-expect-error tribe
    wpm.pointBackgroundColor = textcolor;
    //@ts-expect-error tribe
    wpm.pointBorderColor = textcolor;
  }

  burst.backgroundColor = blendTwoHexColors(
    subaltcolor,
    subaltcolor + "00",
    0.5,
  );
  burst.borderColor = subcolor;
  //@ts-expect-error tribe
  burst.pointBackgroundColor = subcolor;
  //@ts-expect-error tribe
  burst.pointBorderColor = subcolor;

  err.backgroundColor = errorcolor;
  err.borderColor = errorcolor;
  //@ts-expect-error tribe
  err.pointBackgroundColor = errorcolor;
  //@ts-expect-error tribe
  err.pointBorderColor = errorcolor;

  chart.update();
}

export async function drawChart(userId: string): Promise<void> {
  try {
    if (charts[userId]) return;
    const element = $(
      `.pageTest #result #tribeResults table tbody tr#${userId} .minichart canvas`,
    )[0] as HTMLCanvasElement | undefined;

    const room = TribeState.getRoom();
    if (!room || !room.users[userId]?.result || !element) {
      return;
    }

    const chart = new Chart(element, $.extend(true, {}, settings));

    await fillData(chart, userId);

    charts[userId] = chart;
    $(
      `.pageTest #result #tribeResults table tbody tr#${userId} .minichart`,
    ).removeClass("hidden");
    $(
      `.pageTest #result #tribeResults table tbody tr#${userId} .progress`,
    ).addClass("hidden");
    return;
  } catch (e) {
    Notifications.add(createErrorMessage(e, "Error drawing mini chart"), -1);
    return;
  }
}

export async function drawAllCharts(): Promise<void> {
  const room = TribeState.getRoom();
  if (!room) return;
  const list = Object.keys(room.users);
  for (const userId of list) {
    if (!charts[userId]) {
      await drawChart(userId);
    }
  }
}

export async function updateChartMaxValues(): Promise<void> {
  const room = TribeState.getRoom();
  if (!room) return;

  let maxWpm = 0;
  let maxBurst = 0;
  for (const userId of Object.keys(room.users)) {
    const wpmData = charts[userId]?.data.datasets[0]?.data as
      | number[]
      | undefined;
    if (!wpmData) continue;
    const maxWpmUser = Math.max(...wpmData);
    if (maxWpmUser > maxWpm) {
      maxWpm = maxWpmUser;
    }
    const burstData = charts[userId]?.data.datasets[1]?.data as
      | number[]
      | undefined;
    if (!burstData) continue;
    const maxBurstUser = Math.max(...burstData);
    if (maxBurstUser > maxBurst) {
      maxBurst = maxBurstUser;
    }
  }

  const chartmaxval = Math.max(maxWpm, maxBurst);

  console.log("Updating tribe mini chart max values to ", chartmaxval);

  const list = Object.keys(room.users);
  for (const userId of list) {
    if (charts[userId]) {
      const scales = charts[userId].options.scales;
      if (scales?.["wpm"]) {
        scales["wpm"].max = Math.round(chartmaxval);
        scales["wpm"].min = 0;
      }
      if (scales?.["burst"]) {
        scales["burst"].max = Math.round(chartmaxval);
        scales["burst"].min = 0;
      }

      const result = room.users[userId]?.result;
      if (result && scales?.["errors"]) {
        scales["errors"].max = Math.max(...result.chartData.err) + 1;
        scales["errors"].min = 0;
      }

      // charts[userId].options.scales.yAxes[0].ticks.max =
      //   Math.round(chartmaxval);
      // charts[userId].options.scales.yAxes[1].ticks.max =
      //   Math.round(chartmaxval);
      charts[userId].update();
    }
  }
}

export function destroyAllCharts(): void {
  Object.keys(charts).forEach((userId) => {
    charts[userId]?.clear();
    charts[userId]?.destroy();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete charts[userId];
  });
}
