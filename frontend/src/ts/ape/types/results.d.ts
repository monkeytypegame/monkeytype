/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.Results {
  type PostResult = import("@monkeytype/shared-types").PostResultResponse;
  type PatchResult = {
    tagPbs: string[];
  };
  type DeleteAll = null;
}
