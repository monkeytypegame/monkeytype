import { CustomPolyglot as CustomPolyglotType } from "@monkeytype/schemas/configs";
import { Optgroup } from "slim-select/store";
import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import {
  LanguageGroupNames,
  LanguageGroups,
} from "../../../../constants/languages";
import { areUnsortedArraysEqual } from "../../../../utils/arrays";
import { getLanguageDisplayString } from "../../../../utils/strings";
import SlimSelect from "../../../ui/SlimSelect";
import { Setting } from "../Setting";

export function CustomPolyglot(): JSXElement {
  return (
    <Setting
      title="polyglot languages"
      description={configMetadata.customPolyglot.description}
      fa={configMetadata.customPolyglot.fa}
      inputs={
        <SlimSelect
          appendToBody
          multiple
          settings={{
            closeOnSelect: false,
            minSelected: 2,
          }}
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
          selected={getConfig.customPolyglot}
          onChange={(val) => {
            if (
              areUnsortedArraysEqual(
                getConfig.customPolyglot,
                val as CustomPolyglotType,
              )
            ) {
              return;
            }
            setConfig("customPolyglot", val as CustomPolyglotType);
          }}
        />
      }
    />
  );
}
