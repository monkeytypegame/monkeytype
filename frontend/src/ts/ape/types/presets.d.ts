/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.Presets {
  type GetPresets = SharedTypes.DBConfigPreset[];
  type PostConfig = {
    presetId: string;
  };
  type PatchConfig = null;
  type DeleteConfig = null;
}
