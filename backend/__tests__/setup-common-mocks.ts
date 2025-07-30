export function setupCommonMocks() {
  vi.mock("../src/utils/logger", () => ({
    __esModule: true,
    default: {
      error: console.error,
      warning: console.warn,
      info: console.info,
      success: console.info,
      logToDb: console.info,
    },
  }));

  vi.mock("swagger-stats", () => ({
    getMiddleware:
      () =>
      (_: unknown, __: unknown, next: () => unknown): void => {
        next();
      },
  }));

  // TODO: better approach for this when needed
  // https://firebase.google.com/docs/rules/unit-tests#run_local_unit_tests_with_the_version_9_javascript_sdk
  vi.mock("firebase-admin", () => ({
    __esModule: true,
    default: {
      auth: (): unknown => ({
        verifyIdToken: (
          _token: string,
          _checkRevoked: boolean
        ): unknown /* Promise<DecodedIdToken> */ =>
          Promise.resolve({
            aud: "mockFirebaseProjectId",
            auth_time: 123,
            exp: 1000,
            uid: "mockUid",
          }),
      }),
    },
  }));
}
