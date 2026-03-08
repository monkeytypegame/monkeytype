import preview from "#.storybook/preview";

import { ChartJs } from "../../src/ts/components/common/ChartJs";

const meta = preview.meta({
  title: "Common/ChartJs",
  component: ChartJs as any,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
});

export const BarChart = meta.story({
  args: {
    type: "bar",
    data: {
      labels: ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"],
      datasets: [
        {
          label: "Users",
          data: [12, 45, 78, 120, 250, 180, 95, 42, 18, 5],
          minBarLength: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: true, title: { display: true, text: "WPM" } },
        y: {
          beginAtZero: true,
          display: true,
          title: { display: true, text: "Users" },
        },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "300px", width: "600px" }}>
        <Story />
      </div>
    ),
  ],
});

export const LineChart = meta.story({
  args: {
    type: "line",
    data: {
      labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
      datasets: [
        {
          label: "WPM",
          data: [
            65, 68, 72, 70, 75, 78, 80, 82, 79, 85, 88, 90, 87, 92, 95, 93, 98,
            100, 97, 102, 105, 103, 108, 110, 107, 112, 115, 113, 118, 120,
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: true, title: { display: true, text: "Test #" } },
        y: { display: true, title: { display: true, text: "WPM" } },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "300px", width: "600px" }}>
        <Story />
      </div>
    ),
  ],
});

export const ScatterChart = meta.story({
  args: {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Results",
          data: [
            { x: 90, y: 95 },
            { x: 85, y: 92 },
            { x: 100, y: 98 },
            { x: 75, y: 88 },
            { x: 110, y: 97 },
            { x: 95, y: 94 },
            { x: 80, y: 90 },
            { x: 105, y: 96 },
            { x: 70, y: 85 },
            { x: 115, y: 99 },
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: true, title: { display: true, text: "WPM" } },
        y: { display: true, title: { display: true, text: "Accuracy %" } },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "300px", width: "600px" }}>
        <Story />
      </div>
    ),
  ],
});
