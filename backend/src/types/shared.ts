// Shared types between server/client.
export interface ValidModeRule {
  language: string;
  mode: string;
  mode2: string;
}
export interface RewardBracket {
  minRank: number;
  maxRank: number;
  minReward: number;
  maxReward: number;
}

export interface Configuration {
  maintenance: boolean;
  quotes: {
    reporting: {
      enabled: boolean;
      maxReports: number;
      contentReportLimit: number;
    };
    submissionsEnabled: boolean;
    maxFavorites: number;
  };
  results: {
    savingEnabled: boolean;
    objectHashCheckEnabled: boolean;
    filterPresets: {
      enabled: boolean;
      maxPresetsPerUser: number;
    };
    limits: {
      regularUser: number;
      premiumUser: number;
    };
  };
  users: {
    signUp: boolean;
    lastHashesCheck: {
      enabled: boolean;
      maxHashes: number;
    };
    autoBan: {
      enabled: boolean;
      maxCount: number;
      maxHours: number;
    };
    profiles: {
      enabled: boolean;
    };
    discordIntegration: {
      enabled: boolean;
    };
    xp: {
      enabled: boolean;
      funboxBonus: number;
      gainMultiplier: number;
      maxDailyBonus: number;
      minDailyBonus: number;
      streak: {
        enabled: boolean;
        maxStreakDays: number;
        maxStreakMultiplier: number;
      };
    };
    inbox: {
      enabled: boolean;
      maxMail: number;
    };
  };
  admin: {
    endpointsEnabled: boolean;
  };
  apeKeys: {
    endpointsEnabled: boolean;
    acceptKeys: boolean;
    maxKeysPerUser: number;
    apeKeyBytes: number;
    apeKeySaltRounds: number;
  };
  rateLimiting: {
    badAuthentication: {
      enabled: boolean;
      penalty: number;
      flaggedStatusCodes: number[];
    };
  };
  dailyLeaderboards: {
    enabled: boolean;
    leaderboardExpirationTimeInDays: number;
    maxResults: number;
    validModeRules: ValidModeRule[];
    scheduleRewardsModeRules: ValidModeRule[];
    topResultsToAnnounce: number;
    xpRewardBrackets: RewardBracket[];
  };
  leaderboards: {
    weeklyXp: {
      enabled: boolean;
      expirationTimeInDays: number;
      xpRewardBrackets: RewardBracket[];
    };
  };
}
