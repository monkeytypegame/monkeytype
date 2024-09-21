type Mode = import("@monkeytype/contracts/schemas/shared").Mode;
type Result<M extends Mode> =
  import("@monkeytype/contracts/schemas/results").Result<M>;
type IncompleteTest =
  import("@monkeytype/contracts/schemas/results").IncompleteTest;

declare namespace MonkeyTypes {
  /**
   * Result from the rest api but all omittable default values are set (and non optional)
   */
  type FullResult<M extends Mode> = Omit<
    Result<M>,
    | "restartCount"
    | "incompleteTestSeconds"
    | "afkDuration"
    | "tags"
    | "bailedOut"
    | "blindMode"
    | "lazyMode"
    | "funbox"
    | "language"
    | "difficulty"
    | "numbers"
    | "punctuation"
  > & {
    restartCount: number;
    incompleteTestSeconds: number;
    afkDuration: number;
    tags: string[];
    bailedOut: boolean;
    blindMode: boolean;
    lazyMode: boolean;
    funbox: string;
    language: string;
    difficulty: import("@monkeytype/contracts/schemas/shared").Difficulty;
    numbers: boolean;
    punctuation: boolean;
  };
  type CustomTextLimit = {
    value: number;
    mode: import("@monkeytype/contracts/schemas/util").CustomTextLimitMode;
  };

  type CustomTextData = Omit<
    import("@monkeytype/contracts/schemas/results").CustomTextDataWithTextLen,
    "textLen"
  > & {
    text: string[];
  };
}
