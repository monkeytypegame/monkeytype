export class UserDataLoadError extends Error {
  public responseCode: number;
  constructor(message: string, responseCode: number) {
    super(message);
    this.name = "UserDataLoadError";
    this.responseCode = responseCode;
  }
}
