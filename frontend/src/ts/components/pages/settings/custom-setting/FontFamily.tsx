import { ConfigSchema } from "@monkeytype/schemas/configs";
import { createResource, For, JSXElement, Show } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { showNoticeNotification } from "../../../../states/notifications";
import { applyFontFamily } from "../../../../ui";
import FileStorage from "../../../../utils/file-storage";
import { getOptions } from "../../../../utils/zod";
import { Button } from "../../../common/Button";
import { Conditional } from "../../../common/Conditional";
import { Separator } from "../../../common/Separator";
import { Setting } from "../Setting";

export function FontFamily(): JSXElement {
  const [hasLocalFont, { refetch }] = createResource(async () =>
    FileStorage.hasFile("LocalFontFamilyFile"),
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
      title={configMetadata.fontFamily.displayString ?? "font family"}
      fa={configMetadata.fontFamily.fa}
      description={
        <>
          {configMetadata.fontFamily.description}
          <br />
          <div class="mt-2 text-em-xs">
            Note: Local fonts are not sent to the server and will not persist
            across devices.
          </div>
        </>
      }
      inputs={
        <div class="grid gap-4 self-end">
          <Conditional
            if={hasLocalFont()}
            then={
              <Button
                fa={{ icon: "fa-trash" }}
                text="remove local font"
                onClick={() => {
                  void FileStorage.deleteFile("LocalFontFamilyFile").then(
                    () => {
                      void applyFontFamily();
                      void refetch();
                    },
                  );
                }}
              />
            }
            else={
              <>
                <input
                  type="file"
                  id="customFontUploadSolid"
                  accept="font/woff,font/woff2,font/ttf,font/otf"
                  class="hidden"
                  onChange={async (e) => {
                    const fileInput = e.target as HTMLInputElement;
                    const file = fileInput.files?.[0];

                    if (!file) {
                      return;
                    }

                    // check type
                    if (
                      !/font\/(woff|woff2|ttf|otf)/.exec(file.type) &&
                      !/\.(woff|woff2|ttf|otf)$/i.exec(file.name)
                    ) {
                      showNoticeNotification(
                        "Unsupported font format, must be woff, woff2, ttf or otf.",
                      );
                      fileInput.value = "";
                      return;
                    }

                    const dataUrl = await readFileAsDataURL(file);
                    await FileStorage.storeFile("LocalFontFamilyFile", dataUrl);

                    await applyFontFamily();
                    void refetch();

                    fileInput.value = "";
                  }}
                />
                {/* i cant figure out how to trigger the file input with a Button component */}
                <label
                  for="customFontUploadSolid"
                  class="inline-flex w-full cursor-pointer items-center justify-center gap-[0.5em] rounded border-0 bg-sub-alt p-[0.5em] text-text transition-[color,background,opacity] duration-125 hover:bg-text hover:text-bg"
                >
                  <i class="fas fa-file-import"></i>
                  use local font
                </label>
                <Separator text="or" />
              </>
            }
          />
        </div>
      }
      fullWidthInputs={
        <Show when={!hasLocalFont()}>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))] gap-2">
            <For each={getOptions(ConfigSchema.shape.fontFamily)?.sort()}>
              {(option) => {
                const optionsMeta = configMetadata.fontFamily
                  .optionsMetadata as
                  | Record<string, { displayString?: string }>
                  | undefined;
                const match = optionsMeta?.[String(option)];
                const displayString =
                  match?.displayString ?? String(option).replace(/_/g, " ");

                const fontFamily = () => {
                  if (option === "Comic_Sans_MS") {
                    return "Comic Sans MS";
                  }

                  return option.replace(/_/g, " ") + " Preview";
                };

                return (
                  <div
                    style={{
                      "font-family": fontFamily(),
                    }}
                  >
                    <Button
                      class="w-full"
                      text={displayString}
                      active={getConfig.fontFamily === option}
                      onClick={() => {
                        if (getConfig.fontFamily === option) return;
                        setConfig("fontFamily", option);
                      }}
                    />
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      }
    />
  );
}
