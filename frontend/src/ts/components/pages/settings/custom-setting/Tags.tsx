import { JSXElement, For } from "solid-js";

import {
  toggleTagActive,
  useTagsLiveQuery,
} from "../../../../collections/tags";
import { Button } from "../../../common/Button";
import { Setting } from "../Setting";

export function Tags(): JSXElement {
  const tags = useTagsLiveQuery();

  return (
    <Setting
      title="tags"
      description="With tags, you can compare how fast you're typing in different situations. You can see your active tags above the test words. They will remain active until you deactivate them, or refresh the page."
      fa={{
        icon: "fa-tags",
      }}
      inputs={
        <div class="grid gap-2">
          <For each={tags()}>
            {(tag) => (
              <div class="grid grid-cols-[1fr_auto_auto_auto] gap-2">
                <Button
                  text={tag.name}
                  active={tag.active}
                  onClick={() => {
                    toggleTagActive(tag._id);
                  }}
                />
                <Button
                  fa={{
                    icon: "fa-crown",
                  }}
                  onClick={() => {
                    // todo: implement
                  }}
                />
                <Button
                  fa={{
                    icon: "fa-pen",
                  }}
                  onClick={() => {
                    // todo: implement
                  }}
                />
                <Button
                  fa={{
                    icon: "fa-trash",
                  }}
                  onClick={() => {
                    // todo: implement
                  }}
                />
              </div>
            )}
          </For>
          <Button
            text="add tag"
            onClick={() => {
              // todo: implement
            }}
          />
        </div>
      }
    />
  );
}
