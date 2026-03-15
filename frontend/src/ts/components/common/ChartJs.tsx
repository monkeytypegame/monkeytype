import {
  Chart,
  ChartData,
  ChartOptions,
  ChartType,
  DefaultDataPoint,
} from "chart.js";
import { createEffect, JSXElement, onCleanup, onMount } from "solid-js";

import { ChartWithUpdateColors } from "../../controllers/chart-controller";
import { createDebouncedEffectOn } from "../../hooks/effects";
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

  let chart: ChartWithUpdateColors<T, TData> | undefined;

  onMount(() => {
    const canvas = canvasEl();
    if (canvas === undefined) return;
    chart = new ChartWithUpdateColors(canvas.native, {
      type: props.type,
      data: props.data,
      options: props.options,
    });

    props.onChartInit?.(chart);
  });

  createEffect(() => {
    if (!chart) return;

    chart.config.type = props.type;
    chart.data = props.data;
    if (props.options) {
      chart.options = props.options;
    }
    chart.update();
  });

  createDebouncedEffectOn(
    125,
    getTheme,
    (theme) => void chart?.updateColors(theme),
  );

  onCleanup(() => {
    chart?.destroy();
  });

  return <canvas class="chartCanvas" ref={canvasRef}></canvas>;
}
