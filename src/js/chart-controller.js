import Chart from "chart.js";
import * as TestStats from "./test-stats";
import * as ThemeColors from "./theme-colors";
import * as Misc from "./misc";

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
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
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
              TestStats.keypressPerSecond[parseInt(ti.xLabel) - 1].words;

            let unique = [...new Set(wordsToHighlight)];
            unique.forEach((wordIndex) => {
              let wordEl = $($("#resultWordsHistory .words .word")[wordIndex]);
              let input = wordEl.attr("input");
              if (input != undefined)
                wordEl.append(`<div class="wordInputAfter">${input}</div>`);
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

export let accountHistory = new Chart($(".pageAccount #accountHistoryChart"), {
  animationSteps: 60,
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
              resultData.y
            )}%\nacc: ${Misc.roundTo2(100 - resultData.y)}%`;
          }
          let label =
            `${data.datasets[tooltipItem.datasetIndex].label}: ${
              tooltipItem.yLabel
            }` +
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
        afterLabel: function () {
          return;
        },
      },
    },
    animation: {
      duration: 250,
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
    animationSteps: 60,
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
                resultData.y
              )}\nTests Completed: ${resultData.amount}`;
            } else if (tooltipItem.datasetIndex === 1) {
              return `Average Wpm: ${Misc.roundTo2(resultData.y)}`;
            }
          },
          label: function () {
            return;
          },
        },
      },
      animation: {
        duration: 250,
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
            distribution: "series",
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
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 3;
        },
        pointHoverRadius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
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

export function updateColors(chart) {
  if (ThemeColors.main == "") {
    ThemeColors.update();
  }
  chart.data.datasets[0].borderColor = ThemeColors.main;
  chart.data.datasets[1].borderColor = ThemeColors.sub;

  if (chart.data.datasets[0].type === undefined) {
    if (chart.config.type === "line") {
      chart.data.datasets[0].pointBackgroundColor = ThemeColors.main;
    } else if (chart.config.type === "bar") {
      chart.data.datasets[0].backgroundColor = ThemeColors.main;
    }
  } else if (chart.data.datasets[0].type === "bar") {
    chart.data.datasets[0].backgroundColor = ThemeColors.main;
  } else if (chart.data.datasets[0].type === "line") {
    chart.data.datasets[0].pointBackgroundColor = ThemeColors.main;
  }

  if (chart.data.datasets[1].type === undefined) {
    if (chart.config.type === "line") {
      chart.data.datasets[1].pointBackgroundColor = ThemeColors.sub;
    } else if (chart.config.type === "bar") {
      chart.data.datasets[1].backgroundColor = ThemeColors.sub;
    }
  } else if (chart.data.datasets[1].type === "bar") {
    chart.data.datasets[1].backgroundColor = ThemeColors.sub;
  } else if (chart.data.datasets[1].type === "line") {
    chart.data.datasets[1].pointBackgroundColor = ThemeColors.sub;
  }

  try {
    chart.options.scales.xAxes[0].ticks.minor.fontColor = ThemeColors.sub;
    chart.options.scales.xAxes[0].scaleLabel.fontColor = ThemeColors.sub;
  } catch {}

  try {
    chart.options.scales.yAxes[0].ticks.minor.fontColor = ThemeColors.sub;
    chart.options.scales.yAxes[0].scaleLabel.fontColor = ThemeColors.sub;
  } catch {}

  try {
    chart.options.scales.yAxes[1].ticks.minor.fontColor = ThemeColors.sub;
    chart.options.scales.yAxes[1].scaleLabel.fontColor = ThemeColors.sub;
  } catch {}

  try {
    chart.options.scales.yAxes[2].ticks.minor.fontColor = ThemeColors.sub;
    chart.options.scales.yAxes[2].scaleLabel.fontColor = ThemeColors.sub;
  } catch {}

  try {
    chart.data.datasets[0].trendlineLinear.style = ThemeColors.sub;
    chart.data.datasets[1].trendlineLinear.style = ThemeColors.sub;
  } catch {}

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
