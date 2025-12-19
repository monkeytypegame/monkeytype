import { Collection, WithId } from "mongodb";
import * as db from "../init/db";

export const getCollection = (): Collection<WithId<{ uid: string }>> =>
  db.collection("admin-uids");

export async function isAdmin(uid: string): Promise<boolean> {
  const doc = await getCollection().findOne({ uid });
  if (doc) {
    return true;
  } else {
    return false;
  }
}
