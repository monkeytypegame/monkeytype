import request from "supertest";
import app from "../../src/app";
import { ObjectId } from "mongodb";
import { BearerAuthenticationMock, mockBearerAuthentication } from "./auth";
import { afterAll, beforeEach } from "vitest";
import TestAgent from "supertest/lib/agent";

/**
 * Supertest agent bound to 127.0.0.1. `request(app)` listens on `::` but
 * connects to 127.0.0.1, so under load (macOS) it can hit another
 * process's server on the same port and get a random 404.
 */
export function createMockApp(): TestAgent {
  const server = app.listen(0, "127.0.0.1");
  afterAll(() => {
    server.close();
  });
  return request(server);
}

export function setup(): {
  mockApp: TestAgent;
  uid: string;
  mockAuth: BearerAuthenticationMock;
} {
  const mockApp = createMockApp();
  const uid = new ObjectId().toHexString();
  const mockAuth = mockBearerAuthentication(uid);

  beforeEach(() => {
    mockAuth.beforeEach();
  });

  return { mockApp, uid, mockAuth };
}
