type ObjectId = import("mongodb").ObjectId;

declare namespace MonkeyTypes {
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
}
