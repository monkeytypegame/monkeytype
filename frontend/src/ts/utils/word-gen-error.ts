export class WordGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordGenError";
  }
}
