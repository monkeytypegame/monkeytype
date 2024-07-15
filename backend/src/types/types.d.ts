type ObjectId = import("mongodb").ObjectId;
type ExpressRequest = import("express").Request;
/* eslint-disable  @typescript-eslint/no-explicit-any */
type TsRestRequest = import("@ts-rest/express").TsRestRequest<any>;
/* eslint-enable  @typescript-eslint/no-explicit-any */
type AppRoute = import("@ts-rest/core").AppRoute;
type AppRouter = import("@ts-rest/core").AppRouter;

declare namespace MonkeyTypes {
  export type DecodedToken = {
    type: "Bearer" | "ApeKey" | "None";
    uid: string;
    email: string;
  };

  export type Context = {
    configuration: SharedTypes.Configuration;
    decodedToken: DecodedToken;
  };

  type Request = {
    ctx: Readonly<Context>;
  } & ExpressRequest;

  type Request2<TQuery = undefined, TBody = undefined, TParams = undefined> = {
    query: Readonly<TQuery>;
    body: Readonly<TBody>;
    params: Readonly<TParams>;
    ctx: Readonly<Context>;
    raw: Readonly<TsRestRequest>;
  };

  type RequestTsRest = {
    ctx: Readonly<Context>;
  } & TsRestRequest;

  type DBUser = Omit<
    SharedTypes.User,
    | "resultFilterPresets"
    | "tags"
    | "customThemes"
    | "isPremium"
    | "allTimeLbs"
    | "testActivity"
  > & {
    _id: ObjectId;
    resultFilterPresets?: WithObjectId<SharedTypes.ResultFilters>[];
    tags?: DBUserTag[];
    lbPersonalBests?: LbPersonalBests;
    customThemes?: DBCustomTheme[];
    autoBanTimestamps?: number[];
    inbox?: SharedTypes.MonkeyMail[];
    ips?: string[];
    canReport?: boolean;
    lastNameChange?: number;
    canManageApeKeys?: boolean;
    bananas?: number;
    testActivity?: SharedTypes.CountByYearAndDay;
  };

  type DBCustomTheme = WithObjectId<SharedTypes.CustomTheme>;

  type DBUserTag = WithObjectId<SharedTypes.UserTag>;

  type LbPersonalBests = {
    time: Record<number, Record<string, SharedTypes.PersonalBest>>;
  };

  type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
    _id: ObjectId;
  };

  type ApeKeyDB = SharedTypes.ApeKey & {
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
    SharedTypes.DBResult<SharedTypes.Config.Mode>
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
