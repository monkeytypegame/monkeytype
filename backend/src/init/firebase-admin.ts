import admin, { type ServiceAccount } from "firebase-admin";
import Logger from "../utils/logger";
import { readFileSync, existsSync } from "fs";
import MonkeyError from "../utils/error";
import path from "path";
import { isDevEnvironment } from "../utils/misc";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { z } from "zod";

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
    const serviceAccountSchema = z.object({
      type: z.string(),
      project_id: z.string(),
      private_key_id: z.string(),
      private_key: z.string(),
      client_email: z.string().email(),
      client_id: z.string(),
      auth_uri: z.string().url(),
      token_uri: z.string().url(),
      auth_provider_x509_cert_url: z.string().url(),
      client_x509_cert_url: z.string().url(),
    });

    const serviceAccount = parseJsonWithSchema(
      readFileSync(SERVICE_ACCOUNT_PATH, {
        encoding: "utf8",
        flag: "r",
      }),
      serviceAccountSchema
    ) as ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
