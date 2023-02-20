import crypto from "crypto";
import georgeQueue from "../../queues/george-queue";
import { MonkeyResponse } from "../../utils/monkey-response";

const secretHash = process.env.GITHUB_WEBHOOK_SECRET
  ? crypto
      .createHash("sha256")
      .update(process.env.GITHUB_WEBHOOK_SECRET)
      .digest("hex")
  : null;

export async function sendRelease(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { "x-hub-signature-256": signature } = req.headers;
  if (secretHash && signature !== `sha256=${secretHash}`) {
    return new MonkeyResponse("Unauthorized", 401);
  }

  const { release } = req.body;
  const releaseId = release.id;

  await georgeQueue.sendReleaseAnnouncement(releaseId);

  return new MonkeyResponse("OK");
}
