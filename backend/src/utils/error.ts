import { v4 as uuidv4 } from "uuid";
import { isDevEnvironment } from "./misc";
import { MonkeyServerErrorType } from "@monkeytype/contracts/util/api";
import { FirebaseError } from "firebase-admin";

type FirebaseErrorParent = {
  code: string;
  errorInfo: FirebaseError;
};

export function isFirebaseError(err: unknown): err is FirebaseErrorParent {
  return (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    "errorInfo" in err &&
    "codePrefix" in err &&
    typeof err.errorInfo === "object" &&
    err.errorInfo !== null &&
    "code" in err.errorInfo &&
    "message" in err.errorInfo
  );
}

export function getErrorMessage(error: unknown): string | undefined {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    (typeof error.message === "string" || typeof error.message === "number")
  ) {
    message = `${error.message}`;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "number") {
    message = `${error}`;
  }

  if (message === "") {
    return undefined;
  }

  return message;
}

class MonkeyError extends Error implements MonkeyServerErrorType {
  status: number;
  errorId: string;
  uid?: string;

  constructor(status: number, message?: string, stack?: string, uid?: string) {
    super(message);
    this.status = status ?? 500;
    this.errorId = uuidv4();
    this.stack = stack;
    this.uid = uid;

    if (isDevEnvironment()) {
      this.message =
        (stack ?? "")
          ? String(message) + "\nStack: " + String(stack)
          : String(message);
    } else {
      if ((this.stack ?? "") && this.status >= 500) {
        this.stack = this.message + "\n" + this.stack;
        this.message = "Internal Server Error " + this.errorId;
      } else {
        this.message = String(message);
      }
    }
  }
}

export default MonkeyError;
