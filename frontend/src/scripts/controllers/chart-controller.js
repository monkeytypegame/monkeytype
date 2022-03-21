import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
} from "chart.js";

import chartTrendline from "chartjs-plugin-trendline";
import chartAnnotation from "chartjs-plugin-annotation";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  chartTrendline,
  chartAnnotation
);

Chart.defaults.animation.duration = 0;
Chart.defaults.elements.line.tension = 0.3;
Chart.defaults.elements.line.fill = "origin";

import * as TestInput from "../test/test-input";
import * as ThemeColors from "../elements/theme-colors";
import * as Misc from "../utils/misc";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import format from "date-fns/format";
import "chartjs-adapter-date-fns";

class ChartWithUpdateColors extends Chart {
  constructor(item, config) {
    super(item, config);
  }

  updateColors() {
    return updateColors(this);
  }
}

export let result = new ChartWithUpdateColors($("#wpmChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "wpm",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "wpm",
        order: 2,
        radius: 2,
      },
      {
        label: "raw",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 2,
        yAxisID: "raw",
        order: 3,
        radius: 2,
      },
      {
        label: "errors",
        data: [],
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 2,
        order: 1,
        yAxisID: "error",
        maxBarThickness: 10,
        type: "scatter",
        pointStyle: "crossRot",
        radius: function (context) {
          let index = context.dataIndex;
          let value = context.dataset.data[index];
          return value <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context) {
          let index = context.dataIndex;
          let value = context.dataset.data[index];
          return value <= 0 ? 0 : 5;
        },
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        axis: "x",
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        display: true,
        title: {
          display: false,
          text: "Seconds",
        },
      },
      wpm: {
        axis: "y",
        display: true,
        title: {
          display: true,
          text: "Words per Minute",
        },
        beginAtZero: true,
        min: 0,
        ticks: {
          precision: 0,
          autoSkip: true,
          autoSkipPadding: 30,
        },
        grid: {
          display: true,
        },
      },
      raw: {
        axis: "y",
        display: false,
        title: {
          display: true,
          text: "Raw Words per Minute",
        },
        beginAtZero: true,
        min: 0,
        ticks: {
          autoSkip: true,
          autoSkipPadding: 20,
        },
        grid: {
          display: false,
        },
      },
      error: {
        axis: "y",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Errors",
        },
        beginAtZero: true,
        ticks: {
          precision: 0,
          autoSkip: true,
          autoSkipPadding: 20,
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      annotation: {
        annotations: [],
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          afterLabel: function (ti) {
            try {
              $(".wordInputAfter").remove();

              let wordsToHighlight =
                TestInput.keypressPerSecond[parseInt(ti.label) - 1].words;

              let unique = [...new Set(wordsToHighlight)];
              unique.forEach((wordIndex) => {
                let wordEl = $(
                  $("#resultWordsHistory .words .word")[wordIndex]
                );
                let input = wordEl.attr("input");
                if (input != undefined) {
                  wordEl.append(
                    `<div class="wordInputAfter">${input
                      .replace(/\t/g, "_")
                      .replace(/\n/g, "_")
                      .replace(/</g, "&lt")
                      .replace(/>/g, "&gt")}</div>`
                  );
                }
              });
            } catch {}
          },
        },
      },
      legend: {
        display: false,
        labels: {},
      },
    },
  },
});

export let accountHistoryActiveIndex;

export let accountHistory = new ChartWithUpdateColors(
  $(".pageAccount #accountHistoryChart"),
  {
    type: "line",
    data: {
      datasets: [
        {
          yAxisID: "wpm",
          label: "wpm",
          fill: false,
          data: [],
          borderColor: "#f44336",
          borderWidth: 2,
          trendlineLinear: {
            style: "rgba(255,105,180, .8)",
            lineStyle: "dotted",
            width: 4,
          },
        },
        {
          yAxisID: "acc",
          label: "acc",
          fill: false,
          data: [],
          borderColor: "#cccccc",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      hover: {
        mode: "nearest",
        intersect: false,
      },
      scales: {
        x: {
          axis: "x",
          type: "timeseries",
          bounds: "ticks",
          display: false,
          offset: true,
          title: {
            display: false,
            text: "Date",
          },
        },
        wpm: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          ticks: {
            stepSize: 10,
          },
          display: true,
          title: {
            display: true,
            text: "Words per Minute",
          },
        },
        acc: {
          axis: "y",
          beginAtZero: true,
          max: 100,
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Error rate (100 - accuracy)",
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        annotation: {
          annotations: [],
        },
        tooltip: {
          // Disable the on-canvas tooltip
          enabled: true,
          intersect: false,
          external: function (tooltip) {
            if (!tooltip) return;
            // disable displaying the color box;
            tooltip.displayColors = false;
          },
          callbacks: {
            // HERE YOU CUSTOMIZE THE LABELS
            title: function () {
              return;
            },
            beforeLabel: function (tooltipItem) {
              let resultData = tooltipItem.dataset.data[tooltipItem.dataIndex];
              if (tooltipItem.datasetIndex !== 0) {
                return `error rate: ${Misc.roundTo2(
                  resultData.errorRate
                )}%\nacc: ${Misc.roundTo2(100 - resultData.errorRate)}%`;
              }
              let label =
                `${Config.alwaysShowCPM ? "cpm" : "wpm"}: ${resultData.wpm}` +
                "\n" +
                `raw: ${resultData.raw}` +
                "\n" +
                `acc: ${resultData.acc}` +
                "\n\n" +
                `mode: ${resultData.mode} `;

              if (resultData.mode == "time") {
                label += resultData.mode2;
              } else if (resultData.mode == "words") {
                label += resultData.mode2;
              }

              let diff = resultData.difficulty;
              if (diff == undefined) {
                diff = "normal";
              }
              label += "\n" + `difficulty: ${diff}`;

              label +=
                "\n" +
                `punctuation: ${resultData.punctuation}` +
                "\n" +
                `language: ${resultData.language}` +
                "\n\n" +
                `date: ${format(
                  new Date(resultData.timestamp),
                  "dd MMM yyyy HH:mm"
                )}`;

              return label;
            },
            label: function () {
              return;
            },
            afterLabel: function (tooltip) {
              accountHistoryActiveIndex = tooltip.dataIndex;
              return;
            },
          },
        },
        legend: {
          display: false,
          labels: {
            color: "#ffffff",
          },
        },
      },
    },
  }
);

export let accountActivity = new ChartWithUpdateColors(
  $(".pageAccount #accountActivityChart"),
  {
    type: "bar",
    data: {
      datasets: [
        {
          yAxisID: "count",
          label: "Seconds",
          data: [],
          trendlineLinear: {
            style: "rgba(255,105,180, .8)",
            lineStyle: "dotted",
            width: 2,
          },
          order: 3,
        },
        {
          yAxisID: "avgWpm",
          label: "Average Wpm",
          data: [],
          type: "line",
          order: 2,
          tension: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      hover: {
        mode: "nearest",
        intersect: false,
      },
      scales: {
        x: {
          axis: "x",
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
          },
          type: "time",
          time: {
            unit: "day",
            displayFormats: {
              day: "d MMM",
            },
          },
          bounds: "ticks",
          display: true,
          title: {
            display: false,
            text: "Date",
          },
          offset: true,
        },
        count: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
            stepSize: 10,
          },
          display: true,
          title: {
            display: true,
            text: "Time Typing",
          },
        },
        avgWpm: {
          axis: "y",
          beginAtZero: true,
          min: 0,
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
            stepSize: 10,
          },
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Average Wpm",
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        annotation: {
          annotations: [],
        },
        tooltip: {
          callbacks: {
            // HERE YOU CUSTOMIZE THE LABELS
            title: function (tooltipItem) {
              let resultData =
                tooltipItem[0].dataset.data[tooltipItem[0].dataIndex];
              return format(new Date(resultData.x), "dd MMM yyyy");
            },
            beforeLabel: function (tooltipItem) {
              let resultData = tooltipItem.dataset.data[tooltipItem.dataIndex];
              if (tooltipItem.datasetIndex === 0) {
                return `Time Typing: ${Misc.secondsToString(
                  Math.round(resultData.y),
                  true,
                  true
                )}\nTests Completed: ${resultData.amount}`;
              } else if (tooltipItem.datasetIndex === 1) {
                return `Average ${
                  Config.alwaysShowCPM ? "Cpm" : "Wpm"
                }: ${Misc.roundTo2(resultData.y)}`;
              }
            },
            label: function () {
              return;
            },
          },
        },
        legend: {
          display: false,
          labels: {
            color: "#ffffff",
          },
        },
      },
    },
  }
);

export let miniResult = new ChartWithUpdateColors(
  $(".pageAccount #miniResultChart"),
  {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "wpm",
          data: [],
          borderColor: "rgba(125, 125, 125, 1)",
          borderWidth: 2,
          yAxisID: "wpm",
          order: 2,
          radius: 2,
        },
        {
          label: "raw",
          data: [],
          borderColor: "rgba(125, 125, 125, 1)",
          borderWidth: 2,
          yAxisID: "raw",
          order: 3,
          radius: 2,
        },
        {
          label: "errors",
          data: [],
          borderColor: "rgba(255, 125, 125, 1)",
          pointBackgroundColor: "rgba(255, 125, 125, 1)",
          borderWidth: 2,
          order: 1,
          yAxisID: "error",
          maxBarThickness: 10,
          type: "scatter",
          pointStyle: "crossRot",
          radius: function (context) {
            let index = context.dataIndex;
            let value = context.dataset.data[index];
            return value <= 0 ? 0 : 3;
          },
          pointHoverRadius: function (context) {
            let index = context.dataIndex;
            let value = context.dataset.data[index];
            return value <= 0 ? 0 : 5;
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          axis: "x",
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
          },
          display: true,
          title: {
            display: false,
            text: "Seconds",
          },
        },
        wpm: {
          axis: "y",
          display: true,
          title: {
            display: true,
            text: "Words per Minute",
          },
          beginAtZero: true,
          min: 0,
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
          },
          grid: {
            display: true,
          },
        },
        raw: {
          axis: "y",
          display: false,
          title: {
            display: true,
            text: "Raw Words per Minute",
          },
          beginAtZero: true,
          min: 0,
          ticks: {
            autoSkip: true,
            autoSkipPadding: 20,
          },
          grid: {
            display: false,
          },
        },
        error: {
          display: true,
          position: "right",
          title: {
            display: true,
            text: "Errors",
          },
          beginAtZero: true,
          ticks: {
            precision: 0,
            autoSkip: true,
            autoSkipPadding: 20,
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        annotation: {
          annotations: [],
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
        legend: {
          display: false,
          labels: {},
        },
      },
    },
  }
);

function updateAccuracy() {
  accountHistory.data.datasets[1].hidden = !Config.chartAccuracy;
  accountHistory.options.scales["acc"].display = Config.chartAccuracy;
  accountHistory.update();
}

function updateStyle() {
  if (Config.chartStyle == "scatter") {
    accountHistory.data.datasets[0].showLine = false;
    accountHistory.data.datasets[1].showLine = false;
  } else {
    accountHistory.data.datasets[0].showLine = true;
    accountHistory.data.datasets[1].showLine = true;
  }
  accountHistory.updateColors();
}

export async function updateColors(chart) {
  let bgcolor = await ThemeColors.get("bg");
  let subcolor = await ThemeColors.get("sub");
  let maincolor = await ThemeColors.get("main");
  let errorcolor = await ThemeColors.get("error");

  if (chart.data.datasets.every((dataset) => dataset.data.length === 0)) {
    return;
  }

  chart.data.datasets[0].borderColor = maincolor;
  chart.data.datasets[1].borderColor = subcolor;
  if (chart.data.datasets[2]) {
    chart.data.datasets[2].borderColor = errorcolor;
  }

  if (chart.data.datasets[0].type === undefined) {
    if (chart.config.type === "line") {
      chart.data.datasets[0].pointBackgroundColor = maincolor;
    } else if (chart.config.type === "bar") {
      chart.data.datasets[0].backgroundColor = maincolor;
    }
  } else if (chart.data.datasets[0].type === "bar") {
    chart.data.datasets[0].backgroundColor = maincolor;
  } else if (chart.data.datasets[0].type === "line") {
    chart.data.datasets[0].pointBackgroundColor = maincolor;
  }

  if (chart.data.datasets[1].type === undefined) {
    if (chart.config.type === "line") {
      chart.data.datasets[1].pointBackgroundColor = subcolor;
    } else if (chart.config.type === "bar") {
      chart.data.datasets[1].backgroundColor = subcolor;
    }
  } else if (chart.data.datasets[1].type === "bar") {
    chart.data.datasets[1].backgroundColor = subcolor;
  } else if (chart.data.datasets[1].type === "line") {
    chart.data.datasets[1].pointBackgroundColor = subcolor;
  }

  Object.keys(chart.options.scales).forEach((scaleID) => {
    chart.options.scales[scaleID].ticks.color = subcolor;
    chart.options.scales[scaleID].title.color = subcolor;
  });

  try {
    chart.data.datasets[0].trendlineLinear.style = subcolor;
    chart.data.datasets[1].trendlineLinear.style = subcolor;
  } catch {}

  chart.options.plugins.annotation.annotations.forEach((annotation) => {
    annotation.borderColor = subcolor;
    annotation.label.backgroundColor = subcolor;
    annotation.label.color = bgcolor;
  });

  chart.update("none");
}

export function setDefaultFontFamily(font) {
  Chart.defaults.font.family = font.replace(/_/g, " ");
}

export function updateAllChartColors() {
  ThemeColors.update();
  accountHistory.updateColors();
  result.updateColors();
  accountActivity.updateColors();
  miniResult.updateColors();
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "chartAccuracy") updateAccuracy();
  if (eventKey === "chartStyle") updateStyle();
  if (eventKey === "fontFamily") setDefaultFontFamily(eventValue);
});
