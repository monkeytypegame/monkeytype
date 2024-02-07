declare namespace ApeKeysApe {
  type GetApeKeys = Record<string, SharedTypes.ApeKey>;

  type GenerateApeKey = {
    apeKey: string;
    apeKeyId: string;
    apeKeyDetails: SharedTypes.ApeKey;
  };
}
