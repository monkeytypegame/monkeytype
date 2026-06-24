import { IsValidResponse } from "../types/validation";
import { AnyFieldApi } from "@tanstack/solid-form";
import { handleResult } from "../components/ui/form/utils";

type IsValidResponseOrFunction =
  | ((message: string) => IsValidResponse)
  | IsValidResponse;
export function remoteValidation<V, T>(
  call: (
    val: V,
  ) => Promise<{ status: number; body: { data?: T; message: string } }>,
  options?: {
    check?: (data: T) => IsValidResponse;
    on4xx?: IsValidResponseOrFunction;
    on5xx?: IsValidResponseOrFunction;
  },
): (val: V) => Promise<IsValidResponse> {
  return async (val) => {
    const result = await call(val);
    if (result.status <= 299) {
      return options?.check?.(result.body.data as T) ?? true;
    }

    let handler: IsValidResponseOrFunction | undefined;
    if (result.status <= 499) {
      handler = options?.on4xx ?? ((message) => message);
    } else {
      handler = options?.on5xx ?? "Server unavailable. Please try again later.";
    }

    if (typeof handler === "function") return handler(result.body.message);
    return handler;
  };
}

export function remoteValidationForm<V, T>(
  call: (
    val: V,
  ) => Promise<{ status: number; body: { data?: T; message: string } }>,
  options?: {
    check?: (data: T) => IsValidResponse;
    on4xx?: IsValidResponseOrFunction;
    on5xx?: IsValidResponseOrFunction;
  },
): (val: {
  value: V;
  fieldApi: AnyFieldApi;
}) => Promise<undefined | string | string[]> {
  return async (val: { value: V; fieldApi: AnyFieldApi }) => {
    let validationResult;

    const result = await call(val.value);
    if (result.status <= 299) {
      validationResult = options?.check?.(result.body.data as T) ?? undefined;
    } else {
      let handler: IsValidResponseOrFunction | undefined;
      if (result.status <= 499) {
        handler = options?.on4xx ?? ((message) => message);
      } else {
        handler =
          options?.on5xx ?? "Server unavailable. Please try again later.";
      }

      if (typeof handler === "function") {
        validationResult = handler(result.body.message);
      } else {
        validationResult = handler;
      }
    }

    if (validationResult === true || validationResult === undefined) {
      return undefined;
    }
    if (typeof validationResult === "string") return validationResult;

    return handleResult(val.fieldApi, [
      { type: "warning", message: validationResult.warning },
    ]);
  };
}
