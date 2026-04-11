import {
  ConfigSchema,
  CustomBackgroundSchema,
} from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { createResource, createSignal, JSXElement, For, Show } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { applyCustomBackground } from "../../../../controllers/theme-controller";
import { showNoticeNotification } from "../../../../states/notifications";
import FileStorage from "../../../../utils/file-storage";
import { getOptions } from "../../../../utils/zod";
import { AnimeShow } from "../../../common/anime";
import { Button } from "../../../common/Button";
import { Conditional } from "../../../common/Conditional";
import { Fa } from "../../../common/Fa";
import { Separator } from "../../../common/Separator";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { Setting } from "../Setting";

export function CustomBackground(): JSXElement {
  const [showSavedIndicator, setShowSavedIndicator] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      customBackground: getConfig.customBackground,
    },
    onSubmit: ({ value }) => {
      const val = value.customBackground;
      if (val === getConfig.customBackground) return;
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      setConfig("customBackground", val);
    },
  }));

  const [hasLocalBackground] = createResource(
    () => FileStorage.track("LocalBackgroundFile"),
    async () => FileStorage.hasFile("LocalBackgroundFile"),
  );

  const readFileAsDataURL = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <Setting
      title={
        configMetadata.customBackground.displayString ?? "custom background"
      }
      fa={configMetadata.customBackground.fa}
      description={
        <>
          {configMetadata.customBackground.description}
          <br />
          <div class="mt-2 text-em-xs">
            Note: The local image is stored in your browser&apos;s local storage
            and will not be uploaded to the server. This means that if you clear
            your browser&apos;s local storage or use a different browser, the
            local image will be lost.
          </div>
        </>
      }
      inputs={
        <div class="grid gap-2 self-end">
          <Conditional
            if={hasLocalBackground()}
            then={
              <Button
                fa={{ icon: "fa-trash" }}
                text="remove local background"
                onClick={() => {
                  void FileStorage.deleteFile("LocalBackgroundFile").then(
                    () => {
                      void applyCustomBackground();
                    },
                  );
                }}
              />
            }
            else={
              <>
                <input
                  type="file"
                  id="customBackgroundUploadSolid"
                  accept="image/*"
                  class="hidden"
                  onChange={async (e) => {
                    const fileInput = e.target as HTMLInputElement;
                    const file = fileInput.files?.[0];

                    if (!file) {
                      return;
                    }

                    // check type
                    if (!/image\/(jpeg|jpg|png|gif|webp)/.exec(file.type)) {
                      showNoticeNotification("Unsupported image format");
                      fileInput.value = "";
                      return;
                    }

                    const dataUrl = await readFileAsDataURL(file);
                    await FileStorage.storeFile("LocalBackgroundFile", dataUrl);

                    void applyCustomBackground();

                    fileInput.value = "";
                  }}
                />
                {/* i cant figure out how to trigger the file input with a Button component */}
                <label
                  for="customBackgroundUploadSolid"
                  class="inline-flex w-full cursor-pointer items-center justify-center gap-[0.5em] rounded border-0 bg-sub-alt p-[0.5em] text-text transition-[color,background,opacity] duration-125 hover:bg-text hover:text-bg"
                >
                  <i class="fas fa-file-import"></i>
                  use local image
                </label>
              </>
            }
          />

          <Separator text="or" />
          <Show when={!hasLocalBackground()}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <form.Field
                name="customBackground"
                validators={{
                  onChange: ({ value }) => {
                    const val = value;
                    return fromSchema(CustomBackgroundSchema)({
                      value: val,
                    });
                  },
                  onBlur: () => {
                    void form.handleSubmit();
                  },
                }}
                children={(field) => (
                  <div class="relative">
                    <InputField
                      field={field}
                      placeholder={"image url"}
                      showIndicator
                      type="text"
                    />
                    <AnimeShow when={showSavedIndicator()}>
                      <div class="absolute top-0 right-0 rounded bg-sub-alt p-[0.5em] text-main">
                        <Fa icon="fa-save" fixedWidth />
                      </div>
                    </AnimeShow>
                  </div>
                )}
              />
            </form>
          </Show>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(4rem,1fr))] gap-2">
            <For each={getOptions(ConfigSchema.shape.customBackgroundSize)}>
              {(option) => {
                const optionMeta = configMetadata.customBackgroundSize
                  .optionsMetadata as Record<
                  string,
                  { displayString?: string }
                >;
                const displayString =
                  optionMeta?.[String(option)]?.displayString ?? String(option);
                return (
                  <Button
                    active={getConfig.customBackgroundSize === option}
                    onClick={() => {
                      if (getConfig.customBackgroundSize === option) {
                        return;
                      }
                      setConfig("customBackgroundSize", option);
                    }}
                  >
                    {displayString}
                  </Button>
                );
              }}
            </For>
          </div>
        </div>
      }
    />
  );
}
