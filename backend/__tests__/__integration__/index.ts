export const isIntegrationTest = process.env["INTEGRATION_TESTS"] === "true";

export function describeIntegration() {
  return describe.runIf(isIntegrationTest);
}
