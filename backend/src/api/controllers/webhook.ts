import crypto from "crypto";
import georgeQueue from "../../queues/george-queue";
import { MonkeyResponse } from "../../utils/monkey-response";

const secretHash = crypto
  .createHash("sha256")
  .update(process.env.GITHUB_SECRET ?? "")
  .digest("hex");

export async function sendRelease(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { "x-hub-signature-256": signature } = req.headers;
  if (signature && signature !== `sha256=${secretHash}`) {
    return new MonkeyResponse("Unauthorized", 401);
  }

  const { release } = req.body;
  const releaseId = release.id;

  await georgeQueue.sendReleaseAnnouncement(releaseId);

  return new MonkeyResponse("OK");
}
