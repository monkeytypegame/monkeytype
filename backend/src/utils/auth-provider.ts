export function isLocalAuth(): boolean {
  return process.env["AUTH_PROVIDER"] === "local";
}

export function validateAuthProvider(): void {
  const provider = process.env["AUTH_PROVIDER"] ?? "firebase";
  if (provider !== "firebase" && provider !== "local") {
    throw new Error("AUTH_PROVIDER must be firebase or local");
  }
}
