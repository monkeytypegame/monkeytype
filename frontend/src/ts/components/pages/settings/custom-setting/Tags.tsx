import { JSXElement, For } from "solid-js";

import {
  clearTagPBs,
  deleteTag,
  toggleTagActive,
  updateTagName,
  useTagsLiveQuery,
} from "../../../../collections/tags";
import { hideLoaderBar, showLoaderBar } from "../../../../states/loader-bar";
import { showSimpleModal } from "../../../../states/simple-modal";
import { Button } from "../../../common/Button";
import { showAddTagModal } from "../../../modals/AddTagModal";
import { Setting } from "../Setting";

export function Tags(): JSXElement {
  const tags = useTagsLiveQuery();

  return (
    <Setting
      key="tags"
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
                    showSimpleModal({
                      title: "Clear personal bests",
                      text: `Are you sure you want to clear personal bests for tag "${tag.name}"? This action cannot be undone.`,
                      buttonText: "clear",
                      textClass: "text-text",
                      execFn: async () => {
                        showLoaderBar();
                        await clearTagPBs({ tagId: tag._id });
                        hideLoaderBar();
                        return {
                          status: "success",
                          message: "Personal bests cleared",
                        };
                      },
                    });
                  }}
                />
                <Button
                  fa={{
                    icon: "fa-pen",
                  }}
                  onClick={() => {
                    showSimpleModal({
                      title: "Edit tag name",
                      buttonText: "save",
                      focusFirstInput: "focusAndSelect",
                      inputs: [
                        {
                          type: "text",
                          initVal: tag.name,
                        },
                      ],
                      textClass: "text-text",
                      execFn: async (name) => {
                        showLoaderBar();
                        await updateTagName({ tagId: tag._id, newName: name });
                        hideLoaderBar();
                        return {
                          status: "success",
                          message: "Tag name updated",
                        };
                      },
                    });
                  }}
                />
                <Button
                  fa={{
                    icon: "fa-trash",
                  }}
                  onClick={() => {
                    showSimpleModal({
                      title: "Delete tag",
                      text: `Are you sure you want to delete tag "${tag.name}"? This action cannot be undone.`,
                      buttonText: "delete",
                      textClass: "text-text",
                      execFn: async () => {
                        showLoaderBar();
                        await deleteTag({ tagId: tag._id });
                        hideLoaderBar();
                        return {
                          status: "success",
                          message: "Tag deleted",
                        };
                      },
                    });
                  }}
                />
              </div>
            )}
          </For>
          <Button
            text="add tag"
            onClick={() => {
              showAddTagModal();
            }}
          />
        </div>
      }
    />
  );
}
