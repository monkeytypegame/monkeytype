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

export function createErrorMessage(error: unknown, message: string): string {
  const errorMessage = getErrorMessage(error);

  if (errorMessage === undefined) {
    console.error("Could not get error message from error", error);
    return `${message}: Unknown error`;
  }

  return `${message}: ${errorMessage}`;
}
