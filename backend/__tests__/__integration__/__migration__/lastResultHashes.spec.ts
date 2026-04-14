import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
    // Clean up the database after tests run
    await rawCollection.deleteMany({
      uid: { $in: ["test-user-1", "test-user-2", "test-user-3"] },
    });
    await DB.close();
  });

  it("1. should migrate user with only lastReultHashes", async () => {
    // Arrange: Create a user with ONLY the typo field
    await rawCollection.insertOne({
      uid: "test-user-1",
      lastReultHashes: ["hash-old"],
    } as any);

    // Act: Run the migration
    await migrate();

    // Assert: Typo is gone, new field has the data
    const user = await rawCollection.findOne({ uid: "test-user-1" });
    expect(user).toHaveProperty("lastResultHashes");
    expect(user).not.toHaveProperty("lastReultHashes");
    expect(user.lastResultHashes).toEqual(["hash-old"]);
  });

  it("2. should leave user with only lastResultHashes unchanged", async () => {
    // Arrange: Create a clean user
    await rawCollection.insertOne({
      uid: "test-user-2",
      lastResultHashes: ["hash-new"],
    } as any);

    await migrate();

    // Assert: Nothing changed
    const user = await rawCollection.findOne({ uid: "test-user-2" });
    expect(user).toHaveProperty("lastResultHashes");
    expect(user).not.toHaveProperty("lastReultHashes");
    expect(user.lastResultHashes).toEqual(["hash-new"]);
  });

  it("3. should safely handle user with both fields (prevent overwrite)", async () => {
    // Arrange: User has both fields (the race condition Copilot warned about)
    await rawCollection.insertOne({
      uid: "test-user-3",
      lastReultHashes: ["hash-stale"],
      lastResultHashes: ["hash-fresh"],
    } as any);

    await migrate();

    // Assert: Keeps the fresh data, deletes the stale typo field
    const user = await rawCollection.findOne({ uid: "test-user-3" });
    expect(user).toHaveProperty("lastResultHashes");
    expect(user).not.toHaveProperty("lastReultHashes");
    expect(user.lastResultHashes).toEqual(["hash-fresh"]); // Must NOT be 'hash-stale'
  });
});
