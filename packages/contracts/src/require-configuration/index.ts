import { Configuration } from "../schemas/configuration";
type BooleanPaths<T, P extends string = ""> = {
  [K in keyof T]: T[K] extends boolean
    ? P extends ""
      ? K
      : `${P}.${Extract<K, string | number>}`
    : T[K] extends object
    ? BooleanPaths<
        T[K],
        P extends ""
          ? Extract<K, string | number>
          : `${P}.${Extract<K, string | number>}`
      >
    : never;
}[keyof T];

type ConfigurationValue = BooleanPaths<Configuration>;

export type RequireConfiguration = {
  value: ConfigurationValue;
  invalidMessage?: string;
};
