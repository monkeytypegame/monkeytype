export function toMongoFunction(fn: unknown): { lang: "js"; body: string } {
  return {
    lang: "js",
    body: eval(fn as unknown as string).toString(),
  };
}
