type ObjectId = import("mongodb").ObjectId;

type ExpressRequest = import("express").Request;

declare namespace MonkeyTypes {
  interface Configuration {
    maintenance: boolean;
    quoteReport: {
      enabled: boolean;
      maxReports: number;
      contentReportLimit: number;
    };
    quoteSubmit: {
      enabled: boolean;
    };
    resultObjectHashCheck: {
      enabled: boolean;
    };
    apeKeys: {
      endpointsEnabled: boolean;
      acceptKeys: boolean;
      maxKeysPerUser: number;
      apeKeyBytes: number;
      apeKeySaltRounds: number;
    };
    enableSavingResults: {
      enabled: boolean;
    };
    favoriteQuotes: {
      maxFavorites: number;
    };
  }

  interface DecodedToken {
    type: "Bearer" | "ApeKey" | "None";
    uid: string;
    email: string;
  }

  interface Context {
    configuration: Configuration;
    decodedToken: DecodedToken;
  }

  interface Request extends ExpressRequest {
    ctx: Readonly<Context>;
  }

  // Data Model

  interface User {
    addedAt: number;
    verified?: boolean;
    bananas?: number;
    completedTests?: number;
    discordId?: string;
    email: string;
    lastNameChange?: number;
    lbMemory?: object;
    lbPersonalBests?: LbPersonalBests;
    name: string;
    customThemes?: CustomTheme[];
    personalBests?: PersonalBests;
    quoteRatings?: UserQuoteRatings;
    startedTests?: number;
    tags?: UserTag[];
    timeTyping?: number;
    uid: string;
    quoteMod?: boolean;
    cannotReport?: boolean;
    banned?: boolean;
    canManageApeKeys?: boolean;
    favoriteQuotes?: Record<string, string[]>;
    needsToChangeName?: boolean;
  }

  type UserQuoteRatings = Record<string, Record<string, number>>;

  interface LbPersonalBests {
    time: {
      [key: number]: {
        [key: string]: PersonalBest;
      };
    };
  }

  interface UserTag {
    _id: ObjectId;
    name: string;
    personalBests?: PersonalBests;
  }

  interface LeaderboardEntry {
    _id: ObjectId;
    acc: number;
    consistency: number;
    difficulty: Difficulty;
    lazyMode: boolean;
    language: string;
    punctuation: boolean;
    raw: number;
    wpm: number;
    timestamp: number;
    uid: string;
    name: string;
    rank: number;
  }

  interface CustomTheme {
    _id: ObjectId;
    name: string;
    colors: string[];
  }

  interface ApeKey {
    _id: ObjectId;
    uid: string;
    name: string;
    hash: string;
    createdOn: number;
    modifiedOn: number;
    lastUsedOn: number;
    useCount: number;
    enabled: boolean;
  }

  interface NewQuote {
    _id: ObjectId;
    text: string;
    source: string;
    language: string;
    submittedBy: string;
    timestamp: number;
    approved: boolean;
  }

  type Mode = "time" | "words" | "quote" | "zen" | "custom";

  type Mode2<M extends Mode> = keyof PersonalBests[M];

  type Difficulty = "normal" | "expert" | "master";

  interface PersonalBest {
    acc: number;
    consistency: number;
    difficulty: Difficulty;
    lazyMode: boolean;
    language: string;
    punctuation: boolean;
    raw: number;
    wpm: number;
    timestamp: number;
  }

  interface PersonalBests {
    time: {
      [key: number]: PersonalBest[];
    };
    words: {
      [key: number]: PersonalBest[];
    };
    quote: { [quote: string]: PersonalBest[] };
    custom: { custom?: PersonalBest[] };
    zen: {
      zen?: PersonalBest[];
    };
  }

  interface ChartData {
    wpm: number[];
    raw: number[];
    err: number[];
    unsmoothedRaw?: number[];
  }

  interface KeyStats {
    average: number;
    sd: number;
  }

  interface Result<M extends Mode> {
    _id: ObjectId;
    wpm: number;
    rawWpm: number;
    charStats: number[];
    correctChars?: number; // --------------
    incorrectChars?: number; // legacy results
    acc: number;
    mode: M;
    mode2: Mode2<M>;
    quoteLength: number;
    timestamp: number;
    restartCount: number;
    incompleteTestSeconds: number;
    testDuration: number;
    afkDuration: number;
    tags: string[];
    consistency: number;
    keyConsistency: number;
    chartData: ChartData | "toolong";
    uid: string;
    keySpacingStats: KeyStats;
    keyDurationStats: KeyStats;
    isPb?: boolean;
    bailedOut?: boolean;
    blindMode?: boolean;
    lazyMode?: boolean;
    difficulty: Difficulty;
    funbox?: string;
    language: string;
    numbers?: boolean;
    punctuation?: boolean;
    hash?: string;
  }

  interface CompletedEvent extends MonkeyTypes.Result<MonkeyTypes.Mode> {
    keySpacing: number[] | "toolong";
    keyDuration: number[] | "toolong";
    customText: MonkeyTypes.CustomText;
    smoothConsistency: number;
    wpmConsistency: number;
    lang: string;
    challenge?: string | null;
  }

  interface CustomText {
    text: string[];
    isWordRandom: boolean;
    isTimeRandom: boolean;
    word: number;
    time: number;
    delimiter: string;
    textLen?: number;
  }

  interface PSA {
    sticky?: boolean;
    message: string;
    level?: number;
  }

  type ReportTypes = "quote";

  interface Report {
    _id: ObjectId;
    id: string;
    type: ReportTypes;
    timestamp: number;
    uid: string;
    contentId: string;
    reason: string;
    comment: string;
  }

  interface PublicStats {
    _id: string;
    testsCompleted: number;
    testsStarted: number;
    timeTyping: number;
    type: string;
  }

  interface QuoteRating {
    _id: string;
    average: number;
    language: string;
    quoteId: number;
    ratings: number;
    totalRating: number;
  }
}
