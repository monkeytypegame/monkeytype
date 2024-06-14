declare namespace Ape.Dev {
  type CreateTestData = {
    username: string;
    createUser?: boolean;
    firstTestTimestamp?: number;
    lastTestTimestamp?: number;
    minTestsPerDay?: number;
    maxTestsPerDay?: number;
  };
  type CreateTestDataResponse = {
    uid: string;
    email: string;
  };
}
