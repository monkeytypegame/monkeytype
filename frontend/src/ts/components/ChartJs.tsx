import { onMount, onCleanup, createEffect, JSXElement } from "solid-js";
import {
  Chart,
  ChartType,
  ChartData,
  ChartOptions,
  DefaultDataPoint,
} from "chart.js";
import { useRefWithUtils } from "../hooks/useRefWithUtils";
import { ChartWithUpdateColors } from "../controllers/chart-controller";
import { getThemeColors } from "../signals/theme";

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
    //oxlint-disable-next-line no-non-null-assertion
    chart = new ChartWithUpdateColors(canvasEl()!.native, {
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
    void chart.updateColors();
  });

  createEffect(() => {
    //react on theme changes
    const colors = getThemeColors();
    if (!chart) return;
    //TODO pass colors in?
    void chart.updateColors(colors);
  });

  onCleanup(() => {
    chart?.destroy();
  });

  return <canvas ref={canvasRef}></canvas>;
}
