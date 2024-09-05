import { Configuration } from "../schemas/configuration";

type BooleanPaths<T, P extends string = ""> = {
  [K in keyof T]: T[K] extends boolean
    ? P extends ""
      ? K
      : `${P}.${Extract<K, string | number>}`
    : T[K] extends object
    ? `${P}.${Extract<K, string | number>}` extends infer D
      ? D extends string
        ? BooleanPaths<T[K], D>
        : never
      : never
    : never;
}[keyof T];

// Helper type to remove leading dot
type RemoveLeadingDot<T> = T extends `.${infer U}` ? U : T;

export type ConfigurationPath = RemoveLeadingDot<BooleanPaths<Configuration>>;

export type RequireConfiguration = {
  /** path to the configuration, needs to be a boolean value */
  path: ConfigurationPath;
  /** message of the ErrorResponse in case the value is `false` */
  invalidMessage?: string;
};
