import * as DB from "../../src/init/db";
import * as UserDAL from "../../src/dal/user";
import { ObjectId } from "mongodb";
import { PersonalBest } from "@monkeytype/schemas/shared";

export async function createUser(
  user?: Partial<UserDAL.DBUser>
): Promise<UserDAL.DBUser> {
  const uid = new ObjectId().toHexString();
  await UserDAL.addUser("user" + uid, uid + "@example.com", uid);
  await DB.collection("users").updateOne({ uid }, { $set: { ...user } });
  return await UserDAL.getUser(uid, "test");
}

export async function createUserWithoutMigration(
  user?: Partial<UserDAL.DBUser>
): Promise<UserDAL.DBUser> {
  const uid = new ObjectId().toHexString();
  await UserDAL.addUser("user" + uid, uid + "@example.com", uid);
  await DB.collection("users").updateOne({ uid }, { $set: { ...user } });
  await DB.collection("users").updateOne(
    { uid },
    { $unset: { testActivity: "" } }
  );

  return await UserDAL.getUser(uid, "test");
}

export function pb(
  wpm: number,
  acc: number = 90,
  timestamp: number = 1
): PersonalBest {
  return {
    acc,
    consistency: 100,
    difficulty: "normal",
    lazyMode: false,
    language: "english",
    punctuation: false,
    raw: wpm + 1,
    wpm,
    timestamp,
  };
}
