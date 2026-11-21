import { vi } from "vitest";
// the Firebase SDK never loads; auth stays uninitialised (signed out)
vi.mock("../../src/ts/auth/providers/firebase", () => ({}));
