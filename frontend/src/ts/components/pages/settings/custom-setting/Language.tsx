import { Language as LanguageSchema } from "@monkeytype/schemas/languages";
import { Optgroup } from "slim-select/store";
import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import {
  LanguageGroupNames,
  LanguageGroups,
} from "../../../../constants/languages";
import { getLanguageDisplayString } from "../../../../utils/strings";
import SlimSelect from "../../../ui/SlimSelect";
import { Setting } from "../Setting";

export function Language(): JSXElement {
  return (
    <Setting
      title="language"
      description={configMetadata.language.description}
      fa={configMetadata.language.fa}
      inputs={
        <SlimSelect
          appendToBody
          optionGroups={LanguageGroupNames.map(
            (group) =>
              ({
                label: group,
                options: LanguageGroups[group]?.map((language) => ({
                  text: getLanguageDisplayString(language),
                  value: language,
                })),
              }) as Optgroup,
          )}
          selected={getConfig.language}
          onChange={(val) => {
            if (getConfig.language === (val as LanguageSchema)) return;
            setConfig("language", val as LanguageSchema);
          }}
        />
      }
    />
  );
}
