export type ConstraintStateId = number;
export type TokenId = number;
export type RuntimeDevice = "cpu" | "wasm" | "webgpu";

export type TokenizerAdapter = {
  getVocabSize(): number;
  decodeToken(tokenId: TokenId): string;
};

export type DecodedToken = {
  id: TokenId;
  text: string;
};

export type ConstraintEngineStats = {
  stateCount: number;
  tokenCount: number;
  averageValidTokensPerState: number;
};

export type ConstraintStateProfile = {
  stateId: ConstraintStateId;
  prefix: string;
  materialized: boolean;
  materializeMs: number;
  validTokenCount: number;
  accessCount: number;
};

export type LlmTokenTiming = {
  tokenIndex: number;
  stateId: ConstraintStateId;
  contextLength: number;
  validTokenCount: number;
  bufferSize: number;
  forwardMs: number;
  constraintMs: number;
  sampleMs: number;
  totalMs: number;
};
