import {
  CartesianScaleOptions,
  Chart,
  ChartData,
  ChartOptions,
  ChartType,
  DefaultDataPoint,
  ScaleChartOptions,
} from "chart.js";
import { createEffect, JSXElement, onCleanup, onMount } from "solid-js";

import { Theme } from "../../constants/themes";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { getTheme } from "../../signals/theme";

type ChartJSProps<
  T extends ChartType = ChartType,
  TData = DefaultDataPoint<T>,
> = {
  type: T;
  data: ChartData<T, TData>;
  options?: ChartOptions<T>;
  onChartInit?: (chart: Chart<T, TData>) => void;
};

export function ChartJs<T extends ChartType, TData = DefaultDataPoint<T>>(
  props: ChartJSProps<T, TData>,
): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [canvasRef, canvasEl] = useRefWithUtils<HTMLCanvasElement>();

  let chart: Chart<T, TData> | undefined;

  onMount(() => {
    chart = new Chart(
      //oxlint-disable-next-line no-non-null-assertion
      canvasEl()!.native,
      {
        type: props.type,
        data: props.data,
        //@ts-expect-error it's too difficult to figure out these types, but this works
        options: addColorsToOptions(props.options, getTheme),
      },
    );

    props.onChartInit?.(chart);
  });

  createEffect(() => {
    if (!chart) return;

    chart.config.type = props.type;
    chart.data = props.data;
    if (props.options) {
      chart.options = addColorsToOptions(props.options, getTheme);
    }
    chart.update();
  });

  onCleanup(() => {
    chart?.destroy();
  });

  return <canvas class="chartCanvas" ref={canvasRef}></canvas>;
}

function addColorsToOptions<TType extends ChartType = ChartType>(
  options: ChartOptions<TType>,
  theme: () => Theme,
): ChartOptions<TType> {
  //axis colors
  const chartScaleOptions = options as ScaleChartOptions<TType>;
  Object.keys(chartScaleOptions.scales).forEach((scaleID) => {
    const axis = chartScaleOptions.scales[scaleID] as CartesianScaleOptions;
    axis.ticks = {
      ...axis.ticks,
      color: theme().sub,
    };
    axis.title = {
      ...axis.title,
      color: theme().sub,
    };
    axis.grid = {
      ...axis.grid,
      color: theme().subAlt,
      tickColor: theme().subAlt,
      borderColor: theme().subAlt,
    };
  });

  return options;
}
