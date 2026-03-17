import request from "supertest";
import app from "../../src/app";
import { ObjectId } from "mongodb";
import { mockBearerAuthentication } from "./auth";
import { beforeEach } from "vitest";

export function setup() {
  const mockApp = request(app);
  const uid = new ObjectId().toHexString();
  const mockAuth = mockBearerAuthentication(uid);

  beforeEach(() => {
    mockAuth.beforeEach();
  });

  return { mockApp, uid, mockAuth };
}
