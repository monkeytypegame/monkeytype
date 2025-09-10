import { mean, roundTo2, stdDev } from "@monkeytype/util/numbers";

const timings = new Map<string, number[]>();

// Overloads for sync and async functions
export function debugFunctionExecutionTime<T>(
  func: (...options: unknown[]) => T,
  funcName: string
): T;
export function debugFunctionExecutionTime<T>(
  func: (...options: unknown[]) => Promise<T>,
  funcName: string
): Promise<T>;
export function debugFunctionExecutionTime<T>(
  func: (...options: unknown[]) => T | Promise<T>,
  funcName: string
): T | Promise<T> {
  const start = performance.now();
  const ret = func();

  // Check if the result is a Promise
  if (ret instanceof Promise) {
    // Handle async case
    return ret.then((resolvedValue) => {
      logTiming(start, funcName);
      return resolvedValue;
    });
  } else {
    // Handle sync case
    logTiming(start, funcName);
    return ret;
  }
}

function logTiming(start: number, funcName: string): void {
  const end = performance.now();
  const time = end - start;

  if (!timings.has(funcName)) {
    timings.set(funcName, []);
  }

  const arr = timings.get(funcName) as number[];
  arr.push(time);

  console.log(`${funcName} took ${roundTo2(time)} ms`);
  console.log(funcName, {
    average: `${roundTo2(mean(arr))} ms`,
    stdDev: `${roundTo2(stdDev(arr))} ms`,
    min: `${roundTo2(Math.min(...arr))} ms`,
    max: `${roundTo2(Math.max(...arr))} ms`,
    count: arr.length,
  });
  const endOverhead = performance.now();
  //@ts-expect-error chrome api thingy
  console.timeStamp(`#${arr.length} ${funcName}`, start, end, funcName);
  console.timeStamp(
    `#${arr.length} profiling overhead`,
    //@ts-expect-error chrome api thingy
    end,
    endOverhead,
    funcName
  );
}
