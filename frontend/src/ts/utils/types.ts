export type OneOf<T> = {
  [K in keyof T]: {
    [P in K]: T[P];
  } & {
    [P in Exclude<keyof T, K>]?: never;
  };
}[keyof T];

export type ExactlyOneTrue<T extends Record<string, boolean>> = {
  [K in keyof T]: {
    [P in K]: true;
  } & {
    [P in Exclude<keyof T, K>]?: false | never;
  };
}[keyof T];

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
