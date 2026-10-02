// Expected selection constraints should not trigger initialization retries or error reporting.
export class KeySelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeySelectionError";
  }
}
