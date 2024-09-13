import { PostGithubReleaseRequest } from "@monkeytype/contracts/webhooks";
import GeorgeQueue from "../../queues/george-queue";
import { MonkeyResponse2 } from "../../utils/monkey-response";
import MonkeyError from "../../utils/error";

export async function githubRelease(
  req: MonkeyTypes.Request2<undefined, PostGithubReleaseRequest>
): Promise<MonkeyResponse2> {
  const action = req.body.action;

  if (action === "published") {
    const releaseId = req.body.release?.id;
    if (releaseId === undefined)
      throw new MonkeyError(422, 'Missing property "release.id".');

    await GeorgeQueue.sendReleaseAnnouncement(releaseId);
    return new MonkeyResponse2(
      "Added release announcement task to queue",
      null
    );
  }
  return new MonkeyResponse2("No action taken", null);
}
