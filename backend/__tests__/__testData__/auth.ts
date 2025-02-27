import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import { ObjectId } from "mongodb";
import { base64UrlEncode } from "../../src/utils/misc";
import * as ApeKeyDal from "../../src/dal/ape-keys";
import { DecodedIdToken } from "firebase-admin/auth";
import * as AuthUtils from "../../src/utils/auth";

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

export function mockBearerAuthentication(uid: string) {
  const mockDecodedToken = {
    uid,
    email: "newuser@mail.com",
    iat: Date.now(),
  } as DecodedIdToken;
  const verifyIdTokenMock = vi.spyOn(AuthUtils, "verifyIdToken");

  return {
    /**
     * Reset the mock and return a default token. Call this method in the `beforeEach` of all tests.
     */
    beforeEach: (): void => {
      verifyIdTokenMock.mockReset();
      verifyIdTokenMock.mockResolvedValue(mockDecodedToken);
    },
    /**
     * Reset the mock results in the authentication to fail.
     */
    noAuth: (): void => {
      verifyIdTokenMock.mockReset();
    },
    /**
     * verify the authentication has been called
     */
    expectToHaveBeenCalled: (): void => {
      expect(verifyIdTokenMock).toHaveBeenCalled();
    },
    /**
     * modify the token returned by the mock. This can be used to e.g. return a stale token.
     * @param customize
     */
    modifyToken: (customize: Partial<DecodedIdToken>): void => {
      verifyIdTokenMock.mockReset();
      verifyIdTokenMock.mockResolvedValue({
        ...mockDecodedToken,
        ...customize,
      });
    },
  };
}
