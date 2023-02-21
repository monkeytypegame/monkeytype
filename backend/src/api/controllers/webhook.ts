import georgeQueue from "../../queues/george-queue";
import { MonkeyResponse } from "../../utils/monkey-response";

export async function sendRelease(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { release } = req.body;
  const releaseId = release.id;

  await georgeQueue.sendReleaseAnnouncement(releaseId);

  return new MonkeyResponse("OK");
}
