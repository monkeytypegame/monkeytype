/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.Configs {
  type GetConfig = {
    _id: string;
    uid: string;
    config: Partial<SharedTypes.Config>;
  };
  type PostConfig = null;
}
