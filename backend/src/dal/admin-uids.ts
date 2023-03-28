import * as db from "../init/db";

export async function isAdmin(uid: string): Promise<boolean> {
  const doc = await db.collection("admin-uids").findOne({ uid });
  if (doc) {
    return true;
  } else {
    return false;
  }
}
