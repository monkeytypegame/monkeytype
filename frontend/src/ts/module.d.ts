import { Language } from "@monkeytype/schemas/languages";

declare module "virtual:language-hashes" {
  export const languageHashes: Record<Language, string>;
}
