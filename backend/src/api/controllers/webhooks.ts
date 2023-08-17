import { MonkeyResponse } from "../../utils/monkey-response";
import GeorgeQueue from "../../queues/george-queue";

export async function githubRelease(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const action = req.body.action;

  if (action === "published") {
    const releaseName = req.body.release.name;
    await GeorgeQueue.sendReleaseAnnouncement(releaseName);
    return new MonkeyResponse("Added release announcement task to queue");
  }
  return new MonkeyResponse("No action taken");
}
