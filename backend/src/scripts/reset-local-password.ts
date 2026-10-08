import "dotenv/config";
import { createInterface } from "readline";
import { Writable } from "stream";
import * as db from "../init/db";
import { resetPasswordByEmail } from "../services/local-auth";
import { isLocalAuth } from "../utils/auth-provider";

async function main(): Promise<void> {
  if (!isLocalAuth()) {
    throw new Error("This command requires AUTH_PROVIDER=local");
  }
  const email = process.argv[2];
  if (email === undefined || email === "") {
    throw new Error(
      "Usage: node scripts/reset-local-password.js EMAIL (password prompted or read from stdin)",
    );
  }
  let muted = false;
  const output = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const input = createInterface({
    input: process.stdin,
    output,
    terminal: process.stdin.isTTY,
  });
  process.stdout.write("New password: ");
  muted = true;
  const password = await new Promise<string>((resolve, reject) => {
    input.once("line", resolve);
    input.once("close", () => reject(new Error("No password provided")));
  });
  input.close();
  process.stdout.write("\n");
  await db.connect();
  try {
    await resetPasswordByEmail(email, password);
    process.stdout.write("Password reset. All previous sessions revoked.\n");
  } finally {
    await db.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Password reset failed",
  );
  process.exitCode = 1;
});
