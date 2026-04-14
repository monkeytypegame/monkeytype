import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";

vi.unmock("../../../src/init/db");

import { migrate } from "../../../__migration__/lastResultHashes";
import * as DB from "../../../src/init/db";

describe("lastResultHashes migration", () => {
  const collectionName = "users";
  let rawCollection: any;

  beforeAll(async () => {
    await DB.connect();
    rawCollection = DB.getDb()!.collection(collectionName);
  });

  afterAll(async () => {
    await rawCollection.deleteMany({
      uid: { $in: ["test-user-1", "test-user-2", "test-user-3"] },
    });
    await DB.close();
  });

  it("1. should migrate user with only lastReultHashes", async () => {
    await rawCollection.insertOne({
      uid: "test-user-1",
      lastReultHashes: ["hash-old"],
    } as any);

    await migrate();

    const user = await rawCollection.findOne({ uid: "test-user-1" });
    expect(user).toHaveProperty("lastResultHashes");
    expect(user).not.toHaveProperty("lastReultHashes");
    expect(user.lastResultHashes).toEqual(["hash-old"]);
  });

  it("2. should leave user with only lastResultHashes unchanged", async () => {
    await rawCollection.insertOne({
      uid: "test-user-2",
      lastResultHashes: ["hash-new"],
    } as any);

    await migrate();

    const user = await rawCollection.findOne({ uid: "test-user-2" });
    expect(user).toHaveProperty("lastResultHashes");
    expect(user).not.toHaveProperty("lastReultHashes");
    expect(user.lastResultHashes).toEqual(["hash-new"]);
  });

  it("3. should safely handle user with both fields (prevent overwrite)", async () => {
    await rawCollection.insertOne({
      uid: "test-user-3",
      lastReultHashes: ["hash-stale"],
      lastResultHashes: ["hash-fresh"],
    } as any);

    await migrate();

    const user = await rawCollection.findOne({ uid: "test-user-3" });
    expect(user).toHaveProperty("lastResultHashes");
    expect(user).not.toHaveProperty("lastReultHashes");
    expect(user.lastResultHashes).toEqual(["hash-fresh"]);
  });
});
