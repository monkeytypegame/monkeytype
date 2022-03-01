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
    };
    enableSavingResults: {
      enabled: boolean;
    };
  }

  interface DecodedToken {
    uid?: string;
    email?: string;
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
    // TODO, Complete the typings for the user model
    addedAt: number;
    bananas: number;
    completedTests: number;
    discordId?: string;
    email: string;
    lastNameChange: number;
    lbMemory: object;
    lbPersonalBests: object;
    name: string;
    personalBests: object;
    quoteRatings?: Record<string, Record<string, number>>;
    startedTests: number;
    tags: object[];
    timeTyping: number;
    uid: string;
    quoteMod?: boolean;
    cannotReport?: boolean;
    apeKeys?: Record<string, ApeKey>;
  }

  interface ApeKey {
    name: string;
    hash: string;
    createdOn: number;
    modifiedOn: number;
    enabled: boolean;
  }
}
