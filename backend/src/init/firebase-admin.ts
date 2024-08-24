import admin, { type ServiceAccount } from "firebase-admin";
import Logger from "../utils/logger";
import { readFileSync, existsSync } from "fs";
import MonkeyError from "../utils/error";
import path from "path";
import { isDevEnvironment } from "../utils/misc";

const SERVICE_ACCOUNT_PATH = path.join(
  __dirname,
  "../../src/credentials/serviceAccountKey.json"
);

export function init(): void {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    if (isDevEnvironment()) {
      Logger.warning(
        "Firebase service account key not found! Continuing in dev mode, but authentication will throw errors."
      );
    } else {
      throw new MonkeyError(
        500,
        "Firebase service account key not found! Make sure generate a service account key and place it in credentials/serviceAccountKey.json.",
        "init() firebase-admin.ts"
      );
    }
  } else {
    const serviceAccount = JSON.parse(
      readFileSync(SERVICE_ACCOUNT_PATH, {
        encoding: "utf8",
        flag: "r",
      })
    );
    admin.initializeApp({
      credential: admin.credential.cert(
        serviceAccount as unknown as ServiceAccount
      ),
    });
    Logger.success("Firebase app initialized");
  }
}

function get(): typeof admin {
  if (admin.apps.length === 0) {
    throw new MonkeyError(
      500,
      "Firebase app not initialized! Make sure generate a service account key and place it in credentials/serviceAccountKey.json.",
      "get() firebase-admin.ts"
    );
  }
  return admin;
}

export default get;
