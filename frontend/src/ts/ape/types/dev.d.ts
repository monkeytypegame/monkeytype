declare namespace Ape.Dev {
  type GenerateData = {
    username: string;
    createUser?: boolean;
    firstTestTimestamp?: number;
    lastTestTimestamp?: number;
    minTestsPerDay?: number;
    maxTestsPerDay?: number;
  };
  type GenerateDataResponse = {
    uid: string;
    email: string;
  };
}
