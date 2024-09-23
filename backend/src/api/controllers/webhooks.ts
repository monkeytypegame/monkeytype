import { PostGithubReleaseRequest } from "@monkeytype/contracts/webhooks";
import GeorgeQueue from "../../queues/george-queue";
import { MonkeyResponse } from "../../utils/monkey-response";
import MonkeyError from "../../utils/error";
import { MonkeyRequest } from "../types";

export async function githubRelease(
  req: MonkeyRequest<undefined, PostGithubReleaseRequest>
): Promise<MonkeyResponse> {
  const action = req.body.action;

  if (action === "published") {
    const releaseId = req.body.release?.id;
    if (releaseId === undefined)
      throw new MonkeyError(422, 'Missing property "release.id".');

    await GeorgeQueue.sendReleaseAnnouncement(releaseId);
    return new MonkeyResponse("Added release announcement task to queue", null);
  }
  return new MonkeyResponse("No action taken", null);
}
