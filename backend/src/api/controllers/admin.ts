import { MonkeyResponse } from "../../utils/monkey-response";

export async function test(): Promise<MonkeyResponse<string>> {
  return new MonkeyResponse("OK");
}
