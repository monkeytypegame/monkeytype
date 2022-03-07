import _ from "lodash";
import db from "../init/db";
import { Filter, ObjectId, MatchKeysAndValues } from "mongodb";

const COLLECTION_NAME = "ape-keys";

function getApeKeyFilter(
  uid: string,
  keyId: string
): Filter<MonkeyTypes.ApeKey> {
  return {
    _id: new ObjectId(keyId),
    uid,
  };
}

class ApeKeysDAO {
  static async getApeKeys(uid: string): Promise<MonkeyTypes.ApeKey[]> {
    return await db
      .collection<MonkeyTypes.ApeKey>(COLLECTION_NAME)
      .find({ uid })
      .toArray();
  }

  static async getApeKey(
    uid: string,
    keyId: string
  ): Promise<MonkeyTypes.ApeKey | null> {
    return await db
      .collection<MonkeyTypes.ApeKey>(COLLECTION_NAME)
      .findOne(getApeKeyFilter(uid, keyId));
  }

  static async countApeKeysForUser(uid: string): Promise<number> {
    const apeKeys = await this.getApeKeys(uid);
    return _.size(apeKeys);
  }

  static async addApeKey(apeKey: MonkeyTypes.ApeKey): Promise<string> {
    const apeKeyId = new ObjectId();

    await db.collection<MonkeyTypes.ApeKey>(COLLECTION_NAME).insertOne({
      _id: apeKeyId,
      ...apeKey,
    });

    return apeKeyId.toHexString();
  }

  private static async updateApeKey(
    uid: string,
    keyId: string,
    updates: MatchKeysAndValues<MonkeyTypes.ApeKey>
  ): Promise<void> {
    await db
      .collection<MonkeyTypes.ApeKey>(COLLECTION_NAME)
      .updateOne(getApeKeyFilter(uid, keyId), {
        $inc: { useCount: _.has(updates, "lastUsedOn") ? 1 : 0 },
        $set: _.pickBy(updates, (value) => !_.isNil(value)),
      });
  }

  static async editApeKey(
    uid: string,
    keyId: string,
    name: string,
    enabled: boolean
  ): Promise<void> {
    const apeKeyUpdates = {
      name,
      enabled,
      modifiedOn: Date.now(),
    };

    await this.updateApeKey(uid, keyId, apeKeyUpdates);
  }

  static async updateLastUsedOn(uid: string, keyId: string): Promise<void> {
    const apeKeyUpdates = {
      lastUsedOn: Date.now(),
    };

    await this.updateApeKey(uid, keyId, apeKeyUpdates);
  }

  static async deleteApeKey(uid: string, keyId: string): Promise<void> {
    await db
      .collection<MonkeyTypes.ApeKey>(COLLECTION_NAME)
      .deleteOne(getApeKeyFilter(uid, keyId));
  }
}

export default ApeKeysDAO;
