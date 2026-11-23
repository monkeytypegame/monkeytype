import { CustomLayoutFluid } from "@monkeytype/schemas/configs";
import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { LayoutsList } from "../../../../constants/layouts";
import { areUnsortedArraysEqual } from "../../../../utils/arrays";
import SlimSelect from "../../../ui/SlimSelect";
import { SearchableSetting } from "../SearchableSetting";

// built once - a new array on every read would make SlimSelect rebuild its options
const layoutOptions = LayoutsList.map((layout) => ({
  text: layout.replace(/_/g, " "),
  value: layout,
}));

export function CustomLayoutfluid(): JSXElement {
  return (
    <SearchableSetting
      key="customLayoutfluid"
      title="custom layoutfluid"
      description={configMetadata.customLayoutfluid.description}
      fa={configMetadata.customLayoutfluid.fa}
      inputs={
        <SlimSelect
          multiple
          settings={{
            closeOnSelect: false,
            allowDeselect: true,
            minSelected: 2,
          }}
          options={layoutOptions}
          selected={getConfig.customLayoutfluid}
          onChange={(val) => {
            if (
              areUnsortedArraysEqual(
                getConfig.customLayoutfluid,
                val as CustomLayoutFluid,
              )
            ) {
              return;
            }
            setConfig("customLayoutfluid", val as CustomLayoutFluid);
          }}
        />
      }
    />
  );
}
