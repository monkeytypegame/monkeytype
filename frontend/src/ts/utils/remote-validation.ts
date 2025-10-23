import { IsValidResponse } from "../elements/input-validation";

type IsValidResonseOrFunction =
  | ((message: string) => IsValidResponse)
  | IsValidResponse;
export function remoteValidation<V, T>(
  call: (
    val: V
  ) => Promise<{ status: number; body: { data?: T; message: string } }>,
  options?: {
    check?: (data: T) => IsValidResponse;
    on4xx?: IsValidResonseOrFunction;
    on5xx?: IsValidResonseOrFunction;
  }
): (val: V) => Promise<IsValidResponse> {
  return async (val) => {
    const result = await call(val);
    if (result.status <= 299) {
      return options?.check?.(result.body.data as T) ?? true;
    }
    const handler = result.status <= 499 ? options?.on4xx : options?.on5xx;
    if (handler === undefined) return result.body.message;
    if (typeof handler === "function") return handler(result.body.message);
    return handler;
  };
}
