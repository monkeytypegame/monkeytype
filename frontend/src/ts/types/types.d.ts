type Mode = import("@monkeytype/contracts/schemas/shared").Mode;
type Result<M extends Mode> =
  import("@monkeytype/contracts/schemas/results").Result<M>;
type IncompleteTest =
  import("@monkeytype/contracts/schemas/results").IncompleteTest;

declare namespace MonkeyTypes {
  type Theme = {
    name: string;
    bgColor: string;
    mainColor: string;
    subColor: string;
    textColor: string;
  };

  type Quote = {
    text: string;
    britishText?: string;
    source: string;
    length: number;
    id: number;
    group: number;
    language: string;
    textSplit?: string[];
  };

  type QuoteWithTextSplit = Quote & {
    textSplit: string[];
  };

  type ThemeColors = {
    bg: string;
    main: string;
    caret: string;
    sub: string;
    subAlt: string;
    text: string;
    error: string;
    errorExtra: string;
    colorfulError: string;
    colorfulErrorExtra: string;
  };

  type Layout = {
    keymapShowTopRow: boolean;
    matrixShowRightColumn?: boolean;
    type: "iso" | "ansi" | "ortho" | "matrix";
    keys: Keys;
  };

  type Layouts = Record<string, Layout>;
  type Keys = {
    row1: string[];
    row2: string[];
    row3: string[];
    row4: string[];
    row5: string[];
  };

  type WpmAndRaw = {
    wpm: number;
    raw: number;
  };

  type Challenge = {
    name: string;
    display: string;
    autoRole: boolean;
    type: string;
    parameters: (string | number | boolean)[];
    message: string;
    requirements: Record<string, Record<string, string | number | boolean>>;
  };

  type UserBadge = {
    id: number;
    name: string;
    description: string;
    icon?: string;
    background?: string;
    color?: string;
    customStyle?: string;
  };

  type MonkeyMail = {
    id: string;
    subject: string;
    body: string;
    timestamp: number;
    read: boolean;
    rewards: AllRewards[];
  };

  type Reward<T> = {
    type: string;
    item: T;
  };

  type XpReward = {
    type: "xp";
    item: number;
  } & Reward<number>;

  type BadgeReward = {
    type: "badge";
    item: import("@monkeytype/contracts/schemas/users").Badge;
  } & Reward<import("@monkeytype/contracts/schemas/users").Badge>;

  type AllRewards = XpReward | BadgeReward;

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
