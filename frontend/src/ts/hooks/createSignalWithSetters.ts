import { createSignal } from "solid-js";

type OriginalSetter<T> = (value: T | ((prev: T) => T)) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SetterFn<T> = (originalSetter: OriginalSetter<T>, ...args: any[]) => void;
type SetterArgs<T, S extends SetterFn<T>> = S extends (
  orig: OriginalSetter<T>,
  ...args: infer A
) => void
  ? A
  : never;
type SettersMap<T> = Record<string, SetterFn<T>>;
type MappedSetters<T, S extends SettersMap<T>> = {
  [K in keyof S]: (...args: SetterArgs<T, S[K]>) => void;
};

export function createSignalWithSetters<T>(defaultValue: T) {
  return function <S extends SettersMap<T>>(
    setters: S,
  ): [() => T, MappedSetters<T, S>] {
    const [get, _set] = createSignal<T>(defaultValue);
    const mapped = Object.fromEntries(
      Object.entries(setters).map(([key, setter]) => [
        key,
        (...args: never[]) => setter(_set, ...args),
      ]),
    ) as unknown as MappedSetters<T, S>;
    return [get, mapped];
  };
}
