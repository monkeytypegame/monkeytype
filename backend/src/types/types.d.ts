type ObjectId = import("mongodb").ObjectId;

type ExpressRequest = import("express").Request;

declare namespace MonkeyTypes {
  type DecodedToken = {
    type: "Bearer" | "ApeKey" | "None";
    uid: string;
    email: string;
  };

  type Context = {
    configuration: import("@monkeytype/shared-types").Configuration;
    decodedToken: DecodedToken;
  };

  type Request = {
    ctx: Readonly<Context>;
  } & ExpressRequest;

  type DBUser = Omit<
    import("@monkeytype/shared-types").User,
    | "resultFilterPresets"
    | "tags"
    | "customThemes"
    | "isPremium"
    | "allTimeLbs"
    | "testActivity"
  > & {
    _id: ObjectId;
    resultFilterPresets?: WithObjectId<
      import("@monkeytype/shared-types").ResultFilters
    >[];
    tags?: DBUserTag[];
    lbPersonalBests?: LbPersonalBests;
    customThemes?: DBCustomTheme[];
    autoBanTimestamps?: number[];
    inbox?: import("@monkeytype/shared-types").MonkeyMail[];
    ips?: string[];
    canReport?: boolean;
    lastNameChange?: number;
    canManageApeKeys?: boolean;
    bananas?: number;
    testActivity?: import("@monkeytype/shared-types").CountByYearAndDay;
  };

  type DBCustomTheme = WithObjectId<
    import("@monkeytype/shared-types").CustomTheme
  >;

  type DBUserTag = WithObjectId<import("@monkeytype/shared-types").UserTag>;

  type LbPersonalBests = {
    time: Record<
      number,
      Record<string, import("@monkeytype/shared-types/user").PersonalBest>
    >;
  };

  type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
    _id: ObjectId;
  };

  type ApeKeyDB = import("@monkeytype/shared-types").ApeKey & {
    _id: ObjectId;
    uid: string;
    hash: string;
    useCount: number;
  };

  type NewQuote = {
    _id: ObjectId;
    text: string;
    source: string;
    language: string;
    submittedBy: string;
    timestamp: number;
    approved: boolean;
  };

  type ReportTypes = "quote" | "user";

  type Report = {
    _id: ObjectId;
    id: string;
    type: ReportTypes;
    timestamp: number;
    uid: string;
    contentId: string;
    reason: string;
    comment: string;
  };

  type QuoteRating = {
    _id: string;
    average: number;
    language: string;
    quoteId: number;
    ratings: number;
    totalRating: number;
  };

  type FunboxMetadata = {
    name: string;
    canGetPb: boolean;
    difficultyLevel: number;
    properties?: string[];
    frontendForcedConfig?: Record<string, string[] | boolean[]>;
    frontendFunctions?: string[];
  };

  type DBResult = MonkeyTypes.WithObjectId<
    import("@monkeytype/shared-types").DBResult<
      import("@monkeytype/shared-types/config").Mode
    >
  >;

  type BlocklistEntry = {
    _id: string;
    usernameHash?: string;
    emailHash?: string;
    discordIdHash?: string;
    timestamp: number;
  };

  type DBBlocklistEntry = WithObjectId<MonkeyTypes.BlocklistEntry>;
}
