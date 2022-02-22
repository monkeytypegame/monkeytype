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
    monkeyTokens: {
      enabled: boolean;
    };
  }

  interface Context {
    configuration: Configuration;
    decodedToken: {
      uid: string | null;
    };
  }

  interface Request extends ExpressRequest {
    ctx: Context;
  }
}
