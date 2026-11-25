export class WordGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordGenError";
  }
}

/** A newer generation took over: this one stopped without finishing. */
export class GenerationSupersededError extends Error {
  constructor() {
    super("Generation superseded");
    this.name = "GenerationSupersededError";
  }
}
