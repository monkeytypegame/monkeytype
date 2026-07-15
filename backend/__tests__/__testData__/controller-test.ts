import request from "supertest";
import app from "../../src/app";
import { ObjectId } from "mongodb";
import { BearerAuthenticationMock, mockBearerAuthentication } from "./auth";
import { beforeEach } from "vitest";
import TestAgent from "supertest/lib/agent";

export function setup(): {
  mockApp: TestAgent;
  uid: string;
  mockAuth: BearerAuthenticationMock;
} {
  const mockApp = request(app);
  const uid = new ObjectId().toHexString();
  const mockAuth = mockBearerAuthentication(uid);

  beforeEach(() => {
    mockAuth.beforeEach();
  });

  return { mockApp, uid, mockAuth };
}
