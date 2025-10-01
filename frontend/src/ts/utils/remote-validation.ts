import { IsValidResponse } from "../elements/input-validation";

export function apeValidation<T>(
  call: (
    val: string
  ) => Promise<{ status: number; body: { data?: T; message: string } }>,
  options?: {
    check?: (data: T) => IsValidResponse;
    errorMessage?: string;
  }
): (val: string) => Promise<IsValidResponse> {
  return async (val) => {
    const result = await call(val);
    if (result.status === 200) {
      return options?.check?.(result.body.data as T) ?? true;
    } else if (result.status >= 500) {
      return result.body.message;
    } else {
      return options?.errorMessage ?? result.body.message;
    }
  };
}
