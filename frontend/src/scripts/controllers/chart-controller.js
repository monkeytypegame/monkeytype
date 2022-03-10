import Chart from "chart.js";
import * as TestInput from "../test/test-input";
import * as ThemeColors from "../elements/theme-colors";
import * as Misc from "../misc";
import Config from "../config";
import * as ConfigEvent from "../observables/config-event";

Chart.defaults.global.animation.duration = 250;

export let result = new Chart($("#wpmChart"), {
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
    tooltips: {
      mode: "index",
      intersect: false,
      callbacks: {
        afterLabel: function (ti) {
          try {
            $(".wordInputAfter").remove();

            let wordsToHighlight =
              TestInput.keypressPerSecond[parseInt(ti.xLabel) - 1].words;

            let unique = [...new Set(wordsToHighlight)];
            unique.forEach((wordIndex) => {
              let wordEl = $($("#resultWordsHistory .words .word")[wordIndex]);
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
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          ticks: {
            autoSkip: true,
            autoSkipPadding: 40,
          },
          display: true,
          scaleLabel: {
            display: false,
            labelString: "Seconds",
          },
        },
      ],
      yAxes: [
        {
          id: "wpm",
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Words per Minute",
          },
          ticks: {
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: true,
          },
        },
        {
          id: "raw",
          display: false,
          scaleLabel: {
            display: true,
            labelString: "Raw Words per Minute",
          },
          ticks: {
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
        {
          id: "error",
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Errors",
          },
          ticks: {
            precision: 0,
            beginAtZero: true,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
    annotation: {
      annotations: [],
    },
  },
});

export let accountHistoryActiveIndex;

export let accountHistory = new Chart($(".pageAccount #accountHistoryChart"), {
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
    tooltips: {
      // Disable the on-canvas tooltip
      enabled: true,
      intersect: false,
      custom: function (tooltip) {
        if (!tooltip) return;
        // disable displaying the color box;
        tooltip.displayColors = false;
      },
      callbacks: {
        // HERE YOU CUSTOMIZE THE LABELS
        title: function () {
          return;
        },
        beforeLabel: function (tooltipItem, data) {
          let resultData =
            data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
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
            `date: ${moment(resultData.timestamp).format("DD MMM YYYY HH:mm")}`;

          return label;
        },
        label: function () {
          return;
        },
        afterLabel: function (tooltip) {
          accountHistoryActiveIndex = tooltip.index;
          return;
        },
      },
    },
    legend: {
      display: false,
      labels: {
        fontColor: "#ffffff",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    hover: {
      mode: "nearest",
      intersect: false,
    },
    scales: {
      xAxes: [
        {
          ticks: {},
          type: "time",
          bounds: "ticks",
          distribution: "series",
          display: false,
          offset: true,
          scaleLabel: {
            display: false,
            labelString: "Date",
          },
        },
      ],
      yAxes: [
        {
          id: "wpm",
          ticks: {
            beginAtZero: true,
            min: 0,
            stepSize: 10,
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Words per Minute",
          },
        },
        {
          id: "acc",
          ticks: {
            beginAtZero: true,
            max: 100,
          },
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Error rate (100 - accuracy)",
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
  },
});

export let accountActivity = new Chart(
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
          lineTension: 0,
          fill: false,
        },
      ],
    },
    options: {
      tooltips: {
        callbacks: {
          // HERE YOU CUSTOMIZE THE LABELS
          title: function (tooltipItem, data) {
            let resultData =
              data.datasets[tooltipItem[0].datasetIndex].data[
                tooltipItem[0].index
              ];
            return moment(resultData.x).format("DD MMM YYYY");
          },
          beforeLabel: function (tooltipItem, data) {
            let resultData =
              data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
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
          fontColor: "#ffffff",
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      hover: {
        mode: "nearest",
        intersect: false,
      },
      scales: {
        xAxes: [
          {
            ticks: {
              autoSkip: true,
              autoSkipPadding: 40,
            },
            type: "time",
            time: {
              unit: "day",
              displayFormats: {
                day: "D MMM",
              },
            },
            bounds: "ticks",
            distribution: "linear",
            display: true,
            scaleLabel: {
              display: false,
              labelString: "Date",
            },
            offset: true,
          },
        ],
        yAxes: [
          {
            id: "count",
            ticks: {
              beginAtZero: true,
              min: 0,
              autoSkip: true,
              autoSkipPadding: 40,
              stepSize: 10,
            },
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Time Typing",
            },
          },
          {
            id: "avgWpm",
            ticks: {
              beginAtZero: true,
              min: 0,
              autoSkip: true,
              autoSkipPadding: 40,
              stepSize: 10,
            },
            display: true,
            position: "right",
            scaleLabel: {
              display: true,
              labelString: "Average Wpm",
            },
            gridLines: {
              display: false,
            },
          },
        ],
      },
    },
  }
);

export let miniResult = new Chart($(".pageAccount #miniResultChart"), {
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
    tooltips: {
      mode: "index",
      intersect: false,
    },
    legend: {
      display: false,
      labels: {},
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          ticks: {
            autoSkip: true,
            autoSkipPadding: 40,
          },
          display: true,
          scaleLabel: {
            display: false,
            labelString: "Seconds",
          },
        },
      ],
      yAxes: [
        {
          id: "wpm",
          display: true,
          scaleLabel: {
            display: true,
            labelString: "Words per Minute",
          },
          ticks: {
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: true,
          },
        },
        {
          id: "raw",
          display: false,
          scaleLabel: {
            display: true,
            labelString: "Raw Words per Minute",
          },
          ticks: {
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
        {
          id: "error",
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Errors",
          },
          ticks: {
            precision: 0,
            beginAtZero: true,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
    annotation: {
      annotations: [
        {
          enabled: false,
          type: "line",
          mode: "horizontal",
          scaleID: "wpm",
          value: "-30",
          borderColor: "red",
          borderWidth: 1,
          borderDash: [2, 2],
          label: {
            // Background color of label, default below
            backgroundColor: "blue",

            // Font size of text, inherits from global
            fontSize: 11,

            // Font style of text, default below
            fontStyle: "normal",

            // Font color of text, default below
            fontColor: "#fff",

            // Padding of label to add left/right, default below
            xPadding: 6,

            // Padding of label to add top/bottom, default below
            yPadding: 6,

            // Radius of label rectangle, default below
            cornerRadius: 3,

            // Anchor position of label on line, can be one of: top, bottom, left, right, center. Default below.
            position: "center",

            // Whether the label is enabled and should be displayed
            enabled: true,

            // Text to display in label - default is null. Provide an array to display values on a new line
            content: "PB",
          },
        },
      ],
    },
  },
});

function updateAccuracy() {
  accountHistory.data.datasets[1].hidden = !Config.chartAccuracy;
  accountHistory.options.scales.yAxes[1].display = Config.chartAccuracy;
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
  accountHistory.update();
}

export async function updateColors(chart) {
  let bgcolor = await ThemeColors.get("bg");
  let subcolor = await ThemeColors.get("sub");
  let maincolor = await ThemeColors.get("main");
  let errorcolor = await ThemeColors.get("error");

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

  try {
    chart.options.scales.xAxes[0].ticks.minor.fontColor = subcolor;
    chart.options.scales.xAxes[0].scaleLabel.fontColor = subcolor;
  } catch {}

  try {
    chart.options.scales.yAxes[0].ticks.minor.fontColor = subcolor;
    chart.options.scales.yAxes[0].scaleLabel.fontColor = subcolor;
  } catch {}

  try {
    chart.options.scales.yAxes[1].ticks.minor.fontColor = subcolor;
    chart.options.scales.yAxes[1].scaleLabel.fontColor = subcolor;
  } catch {}

  try {
    chart.options.scales.yAxes[2].ticks.minor.fontColor = subcolor;
    chart.options.scales.yAxes[2].scaleLabel.fontColor = subcolor;
  } catch {}

  try {
    chart.data.datasets[0].trendlineLinear.style = subcolor;
    chart.data.datasets[1].trendlineLinear.style = subcolor;
  } catch {}

  try {
    chart.options.annotation.annotations.forEach((annotation) => {
      annotation.borderColor = subcolor;
      annotation.label.backgroundColor = subcolor;
      annotation.label.fontColor = bgcolor;
    });
  } catch {}

  // ChartController.result.options.annotation.annotations.push({
  //   enabled: false,
  //   type: "line",
  //   mode: "horizontal",
  //   scaleID: "wpm",
  //   value: lpb,
  //   borderColor: themecolors['sub'],
  //   borderWidth: 1,
  //   borderDash: [2, 2],
  //   label: {
  //     backgroundColor: themecolors['sub'],
  //     fontFamily: Config.fontFamily.replace(/_/g, " "),
  //     fontSize: 11,
  //     fontStyle: "normal",
  //     fontColor: themecolors['bg'],
  //     xPadding: 6,
  //     yPadding: 6,
  //     cornerRadius: 3,
  //     position: "center",
  //     enabled: true,
  //     content: `PB: ${lpb}`,
  //   },
  // });

  chart.update();
}

Chart.prototype.updateColors = function () {
  updateColors(this);
};

export function setDefaultFontFamily(font) {
  Chart.defaults.global.defaultFontFamily = font.replace(/_/g, " ");
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
