/* not working
interface ArrayWithLength<T, L extends number> extends Array<T> {
  length: L;
}

type ValidPath<T, K extends string> = K extends keyof T
  ? K
  : K extends `${infer F}.${infer R}`
  ? F extends keyof T
    ? `${F}.${ValidPath<T[F], R>}`
    : Extract<keyof T, string>
  : Extract<keyof T, string>;

type DeepIdx<T, K extends string> = K extends keyof T
  ? T[K]
  : K extends `${infer F}.${infer R}`
  ? F extends keyof T
    ? DeepIdx<T[F], R>
    : never
  : never;

type MongoFunctionProps<T, K extends string, L extends number> = {
  type: T;
  args: ArrayWithLength<
    { path?: ValidPath<T, K> } | { value?: string | number },
    L
  >;
  fn: (...args: ArrayWithLength<DeepIdx<T, K>, L>) => unknown;
};

export function toMongoFunctionSafeNotWorking<
  T,
  K extends string,
  L extends number
>({
  args,
  fn,
}: MongoFunctionProps<T, K, L>): { lang: "js"; body: string; args: string[] } {
  return {
    lang: "js",
    body: fn.toString(),
    args: args.map((it) =>
      it["path"] !== undefined ? "$" + it["path"] : it["value"]
    ),
  };
}
*/
export function wrapMongoFunction(fn: unknown): (...args: unknown[]) => {
  args: unknown[];
  lang: "js";
  body: string;
} {
  return (...args) => {
    const body = (fn as unknown as string).toString();
    return {
      args: args,
      lang: "js",
      body: body,
    };
  };
}
