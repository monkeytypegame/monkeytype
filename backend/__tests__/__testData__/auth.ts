import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import { ObjectId } from "mongodb";
import { base64UrlEncode } from "../../src/utils/misc";
import * as ApeKeyDal from "../../src/dal/ape-keys";

export async function mockAuthenticateWithApeKey(
  uid: string,
  config: Configuration
): Promise<string> {
  if (!config.apeKeys.acceptKeys)
    throw Error("config.apeKeys.acceptedKeys needs to be set to true");
  const { apeKeyBytes, apeKeySaltRounds } = config.apeKeys;

  const apiKey = randomBytes(apeKeyBytes).toString("base64url");
  const saltyHash = await hash(apiKey, apeKeySaltRounds);

  const apeKey: ApeKeyDal.DBApeKey = {
    _id: new ObjectId(),
    name: "bob",
    enabled: true,
    uid,
    hash: saltyHash,
    createdOn: Date.now(),
    modifiedOn: Date.now(),
    lastUsedOn: -1,
    useCount: 0,
  };

  const apeKeyId = new ObjectId().toHexString();

  vi.spyOn(ApeKeyDal, "getApeKey").mockResolvedValue(apeKey);
  vi.spyOn(ApeKeyDal, "updateLastUsedOn").mockResolvedValue();

  return base64UrlEncode(`${apeKeyId}.${apiKey}`);
}
