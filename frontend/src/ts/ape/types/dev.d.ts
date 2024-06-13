declare namespace Ape.Dev {
  type CreateTestData = {
    username: string;
    password: string;
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
