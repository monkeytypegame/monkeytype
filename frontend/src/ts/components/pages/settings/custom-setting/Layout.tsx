import { Layout as LayoutSchema } from "@monkeytype/schemas/configs";
import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { LayoutsList } from "../../../../constants/layouts";
import SlimSelect from "../../../ui/SlimSelect";
import { Setting } from "../Setting";

export function Layout(): JSXElement {
  return (
    <Setting
      title="layout"
      description={configMetadata.layout.description}
      fa={configMetadata.layout.fa}
      inputs={
        <SlimSelect
          appendToBody
          options={LayoutsList.map((layout) => ({
            text: layout.replace(/_/g, " "),
            value: layout,
          }))}
          selected={getConfig.layout}
          onChange={(val) => {
            if (getConfig.layout === (val as LayoutSchema)) return;
            setConfig("layout", val as LayoutSchema);
          }}
        />
      }
    />
  );
}
