/**
 * This is the base schema for the configuration of the API backend.
 * To add a new configuration. Simply add it to this object.
 * When changing this template, please follow the principle of "Secure by default" (https://en.wikipedia.org/wiki/Secure_by_default).
 */
const BASE_CONFIGURATION: MonkeyTypes.Configuration = {
  maintenance: false,
  quoteReport: {
    enabled: false,
    maxReports: 0,
    contentReportLimit: 0,
  },
  quoteSubmit: {
    enabled: false,
  },
  resultObjectHashCheck: {
    enabled: false,
  },
  apeKeys: {
    endpointsEnabled: false,
    acceptKeys: false,
    maxKeysPerUser: 0,
    apeKeyBytes: 24,
    apeKeySaltRounds: 5,
  },
  enableSavingResults: {
    enabled: false,
  },
};

export default BASE_CONFIGURATION;
