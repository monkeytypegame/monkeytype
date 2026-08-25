export class SnapshotInitError extends Error {
  public responseCode: number;
  constructor(message: string, responseCode: number) {
    super(message);
    this.name = "SnapshotInitError";
    this.responseCode = responseCode;
  }
}
