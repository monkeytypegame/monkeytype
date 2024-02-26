import { MonkeyResponse } from "../../utils/monkey-response";

export async function test(): Promise<MonkeyResponseNonExistin> {
  return new MonkeyResponse("OK");
}
