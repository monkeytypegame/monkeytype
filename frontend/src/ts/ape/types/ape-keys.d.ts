/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.ApeKeys {
  type GetApeKeys = Record<string, SharedTypes.ApeKey>;

  type GenerateApeKey = {
    apeKey: string;
    apeKeyId: string;
    apeKeyDetails: SharedTypes.ApeKey;
  };
}
