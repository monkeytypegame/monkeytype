import { MonkeyResponse } from "../../utils/monkey-response";

export async function test(): Promise<MonkeyResponse> {
  return new MonkeyResponse("OK");
}
