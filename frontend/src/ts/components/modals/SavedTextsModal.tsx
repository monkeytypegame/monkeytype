import { createSignal, For, Index, JSXElement, Setter, Show } from "solid-js";

import * as CustomTextState from "../../legacy-states/custom-text-name";
import { hideModal } from "../../states/modals";
import { showSimpleModal } from "../../states/simple-modal";
import * as CustomText from "../../test/custom-text";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Separator } from "../common/Separator";

type CustomTextIncomingData =
  | ({ set?: boolean; long?: boolean } & (
      | { text: string; splitText?: never }
      | { text?: never; splitText: string[] }
    ))
  | null;

function getSavedText(name: string, long: boolean): string {
  let text = CustomText.getCustomText(name, long);
  if (long) {
    text = text.slice(CustomText.getCustomTextLongProgress(name));
  }
  return text.join(" ");
}

export function SavedTextsModal(props: {
  setChainedData: Setter<CustomTextIncomingData>;
}): JSXElement {
  const [names, setNames] = createSignal<string[]>([]);
  const [longNames, setLongNames] = createSignal<string[]>([]);

  // because the progress is stored in local storage,
  // we need to trigger a refresh when it changes to update the reset button state
  const [version, setVersion] = createSignal(0);

  const refresh = () => {
    setNames(CustomText.getCustomTextNames(false));
    setLongNames(CustomText.getCustomTextNames(true));
    setVersion((v) => v + 1);
  };

  const handleNameClick = (name: string, long: boolean) => {
    CustomTextState.setCustomTextName(name, long);
    const text = getSavedText(name, long);
    props.setChainedData({ text, long });
    hideModal("SavedTexts");
  };

  const handleDelete = (name: string, long: boolean) => {
    showSimpleModal({
      title: "Delete custom text",
      text: `Are you sure you want to delete custom text ${name}?`,
      buttonText: "delete",
      execFn: async () => {
        CustomText.deleteCustomText(name, long);
        CustomTextState.setCustomTextName("", undefined);
        refresh();
        return {
          status: "success",
          message: "Custom text deleted",
        };
      },
    });
  };

  const handleResetProgress = (name: string) => {
    showSimpleModal({
      title: "Reset progress for custom text",
      text: `Are you sure you want to reset your progress for custom text ${name}?`,
      buttonText: "reset",
      execFn: async () => {
        CustomText.setCustomTextLongProgress(name, 0);
        const text = CustomText.getCustomText(name, true);
        CustomText.setText(text);
        refresh();
        return {
          status: "success",
          message: "Custom text progress reset",
        };
      },
    });
  };

  return (
    <AnimatedModal
      id="SavedTexts"
      title="Saved texts"
      modalClass="max-w-[500px]"
      beforeShow={refresh}
    >
      <div class="grid gap-2">
        <Show
          when={names().length > 0}
          fallback={<div class="text-sub">No saved custom texts found</div>}
        >
          <For each={names()}>
            {(name) => (
              <div class="flex items-center gap-2">
                <Button
                  variant="button"
                  text={name}
                  class="flex-1"
                  onClick={() => handleNameClick(name, false)}
                />
                <Button
                  variant="button"
                  fa={{ icon: "fa-trash", fixedWidth: true }}
                  onClick={() => handleDelete(name, false)}
                />
              </div>
            )}
          </For>
        </Show>
      </div>

      <div class="text-2xl text-sub">Saved long texts</div>

      <div class="grid gap-2">
        <Show
          when={longNames().length > 0}
          fallback={
            <div class="text-sub">No saved long custom texts found</div>
          }
        >
          <Index each={longNames()}>
            {(name) => {
              const hasProgress = () => {
                version();
                return CustomText.getCustomTextLongProgress(name()) > 0;
              };
              return (
                <div class="flex items-center gap-2">
                  <Button
                    variant="button"
                    text={name()}
                    class="flex-1"
                    onClick={() => handleNameClick(name(), true)}
                  />
                  <Button
                    variant="button"
                    text="reset"
                    disabled={!hasProgress()}
                    onClick={() => handleResetProgress(name())}
                  />
                  <Button
                    variant="button"
                    fa={{ icon: "fa-trash", fixedWidth: true }}
                    onClick={() => handleDelete(name(), true)}
                  />
                </div>
              );
            }}
          </Index>
        </Show>
      </div>

      <Separator />

      <div class="text-em-xs text-sub">
        Heads up! These texts are only stored locally. If you switch devices or
        clear your local browser data they will be lost.
      </div>
    </AnimatedModal>
  );
}
