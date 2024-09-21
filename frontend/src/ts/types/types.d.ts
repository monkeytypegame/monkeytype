type Mode = import("@monkeytype/contracts/schemas/shared").Mode;
type Result<M extends Mode> =
  import("@monkeytype/contracts/schemas/results").Result<M>;
type IncompleteTest =
  import("@monkeytype/contracts/schemas/results").IncompleteTest;

declare namespace MonkeyTypes {
  type TypingSpeedUnitSettings = {
    fromWpm: (number: number) => number;
    toWpm: (number: number) => number;
    fullUnitString: string;
    histogramDataBucketSize: number;
    historyStepSize: number;
  };

  type TestActivityCalendar = {
    getMonths: () => TestActivityMonth[];
    getDays: () => TestActivityDay[];
    getTotalTests: () => number;
  };

  type ModifiableTestActivityCalendar = TestActivityCalendar & {
    increment: (date: Date) => void;
    getFullYearCalendar: () => TestActivityCalendar;
  };

  type TestActivityDay = {
    level: string;
    label?: string;
  };

  type TestActivityMonth = {
    text: string;
    weeks: number;
  };

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
