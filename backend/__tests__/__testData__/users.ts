import * as DB from "../../src/init/db";
import * as UserDAL from "../../src/dal/user";
import { ObjectId } from "mongodb";

export async function createUser(
  user?: Partial<MonkeyTypes.DBUser>
): Promise<MonkeyTypes.DBUser> {
  const uid = new ObjectId().toHexString();
  await UserDAL.addUser("user" + uid, uid + "@example.com", uid);
  await DB.collection("users").updateOne({ uid }, { $set: { ...user } });
  return await UserDAL.getUser(uid, "test");
}

export async function createUserWithoutMigration(
  user?: Partial<MonkeyTypes.DBUser>
): Promise<MonkeyTypes.DBUser> {
  const uid = new ObjectId().toHexString();
  await UserDAL.addUser("user" + uid, uid + "@example.com", uid);
  await DB.collection("users").updateOne({ uid }, { $set: { ...user } });
  await DB.collection("users").updateOne(
    { uid },
    { $unset: { testActivity: "" } }
  );

  return await UserDAL.getUser(uid, "test");
}
