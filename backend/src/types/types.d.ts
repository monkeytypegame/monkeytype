type ObjectId = import("mongodb").ObjectId;

type ExpressRequest = import("express").Request;
/* eslint-disable  @typescript-eslint/no-explicit-any */
type TsRestRequest = import("@ts-rest/express").TsRestRequest<any>;
/* eslint-enable  @typescript-eslint/no-explicit-any */
type AppRoute = import("@ts-rest/core").AppRoute;
type AppRouter = import("@ts-rest/core").AppRouter;
declare namespace MonkeyTypes {
  export type DecodedToken = {
    type: "Bearer" | "ApeKey" | "None" | "GithubWebhook";
    uid: string;
    email: string;
  };

  export type Context = {
    configuration: import("@monkeytype/contracts/schemas/configuration").Configuration;
    decodedToken: DecodedToken;
  };

  type Request = {
    ctx: Readonly<Context>;
  } & ExpressRequest;

  type ExpressRequestWithContext = {
    ctx: Readonly<Context>;
  } & ExpressRequest;

  type Request2<TQuery = undefined, TBody = undefined, TParams = undefined> = {
    query: Readonly<TQuery>;
    body: Readonly<TBody>;
    params: Readonly<TParams>;
    ctx: Readonly<Context>;
    raw: Readonly<TsRestRequest>;
  };

  /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
  type RequestHandler = import("@ts-rest/core").TsRestRequestHandler<any>;

  type DBUser = Omit<
    import("@monkeytype/contracts/schemas/users").User,
    | "resultFilterPresets"
    | "tags"
    | "customThemes"
    | "isPremium"
    | "allTimeLbs"
    | "testActivity"
  > & {
    _id: ObjectId;
    resultFilterPresets?: WithObjectId<
      import("@monkeytype/contracts/schemas/users").ResultFilters
    >[];
    tags?: DBUserTag[];
    lbPersonalBests?: LbPersonalBests;
    customThemes?: DBCustomTheme[];
    autoBanTimestamps?: number[];
    inbox?: import("@monkeytype/contracts/schemas/users").MonkeyMail[];
    ips?: string[];
    canReport?: boolean;
    lastNameChange?: number;
    canManageApeKeys?: boolean;
    bananas?: number;
    testActivity?: import("@monkeytype/contracts/schemas/users").CountByYearAndDay;
  };

  type DBCustomTheme = WithObjectId<
    import("@monkeytype/contracts/schemas/users").CustomTheme
  >;

  type DBUserTag = WithObjectId<
    import("@monkeytype/contracts/schemas/users").UserTag
  >;

  type LbPersonalBests = {
    time: Record<
      number,
      Record<
        string,
        import("@monkeytype/contracts/schemas/shared").PersonalBest
      >
    >;
  };

  type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
    _id: ObjectId;
  };

  type ApeKeyDB = import("@monkeytype/contracts/schemas/ape-keys").ApeKey & {
    _id: ObjectId;
    uid: string;
    hash: string;
    useCount: number;
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

  type FunboxMetadata = {
    name: string;
    canGetPb: boolean;
    difficultyLevel: number;
    properties?: string[];
    frontendForcedConfig?: Record<string, string[] | boolean[]>;
    frontendFunctions?: string[];
  };

  type DBResult = MonkeyTypes.WithObjectId<
    import("@monkeytype/contracts/schemas/results").Result<
      import("@monkeytype/contracts/schemas/shared").Mode
    >
  > & {
    //legacy values
    correctChars?: number;
    incorrectChars?: number;
  };

  type BlocklistEntry = {
    _id: string;
    usernameHash?: string;
    emailHash?: string;
    discordIdHash?: string;
    timestamp: number;
  };

  type DBBlocklistEntry = WithObjectId<MonkeyTypes.BlocklistEntry>;
}
