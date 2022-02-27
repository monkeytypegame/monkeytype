type ConfigValues =
  | string
  | number
  | boolean
  | string[]
  | MonkeyTypes.QuoteLength[]
  | MonkeyTypes.ResultFilters
  | MonkeyTypes.CustomBackgroundFilter
  | null
  | undefined;

type SubscribeFunction = (
  key: string,
  newValue?: ConfigValues,
  nosave?: boolean,
  previousValue?: ConfigValues,
  fullConfig?: MonkeyTypes.Config
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(
  key: string,
  newValue?: ConfigValues,
  nosave?: boolean,
  previousValue?: ConfigValues,
  fullConfig?: MonkeyTypes.Config
): void {
  subscribers.forEach((fn) => {
    try {
      fn(key, newValue, nosave, previousValue, fullConfig);
    } catch (e) {
      console.error("Config event subscriber threw an error");
      console.error(e);
    }
  });
}
