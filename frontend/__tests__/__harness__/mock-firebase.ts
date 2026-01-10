import { vi } from "vitest";
vi.mock("../../src/ts/firebase", () => ({
  app: undefined,
  Auth: undefined,
  isAuthenticated: () => false,
}));
