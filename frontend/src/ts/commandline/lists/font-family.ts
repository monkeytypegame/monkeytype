import { Command } from "../types";
import { buildCommandForConfigKey } from "../util";
import FileStorage from "../../utils/file-storage";
import { applyFontFamily } from "../../controllers/theme-controller";
import { updateUI } from "../../elements/settings/custom-font-picker";
import * as Notifications from "../../elements/notifications";
import Config, { setConfig } from "../../config";

const fromMeta = buildCommandForConfigKey("fontFamily");

if (fromMeta.subgroup) {
  fromMeta.subgroup.list.push({
    id: "customFont",
    display: "Custom font...",
    icon: "fa-font",
    alias: "custom font options",
    subgroup: {
      title: "Custom font...",
      list: [
        {
          id: "customFontName",
          display: "Custom name...",
          icon: "fa-font",
          alias: "custom font name",
          input: true,
          defaultValue: (): string => {
            return Config.fontFamily.replace(/_/g, " ");
          },
          exec: ({ input }): void => {
            if (input === undefined || input === "") return;
            const fontName = input.replaceAll(/ /g, "_");
            setConfig("fontFamily", fontName);
          },
        },
        {
          id: "customLocalFont",
          display: "Local font...",
          icon: "fa-file-import fa-fw",
          alias: "upload font",
          available: async (): Promise<boolean> => {
            return !(await FileStorage.hasFile("LocalFontFamilyFile"));
          },
          exec: async (): Promise<void> => {
            const inputElement = document.createElement("input");
            inputElement.type = "file";
            inputElement.accept = "font/woff,font/woff2,font/ttf,font/otf";
            inputElement.style.display = "none";
            document.body.appendChild(inputElement);

            const cleanup = (): void => {
              document.body.removeChild(inputElement);
            };

            inputElement.onchange = async (event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              if (!file) {
                cleanup();
                return;
              }

              // check type
              if (
                !/font\/(woff|woff2|ttf|otf)/.exec(file.type) &&
                !/\.(woff|woff2|ttf|otf)$/i.exec(file.name)
              ) {
                Notifications.add(
                  "Unsupported font format, must be woff, woff2, ttf or otf.",
                  0,
                );
                cleanup();
                return;
              }

              const reader = new FileReader();
              reader.onload = async (readerEvent) => {
                const dataUrl = readerEvent.target?.result as string;
                try {
                  await FileStorage.storeFile("LocalFontFamilyFile", dataUrl);
                  await applyFontFamily();
                  await updateUI();
                } catch (e) {
                  Notifications.add(
                    "Error uploading font: " + (e as Error).message,
                    0,
                  );
                }
                cleanup();
              };
              reader.onerror = cleanup;
              reader.readAsDataURL(file);
            };
            inputElement.click();
          },
        },
        {
          id: "removeLocalFont",
          display: "Remove local font",
          icon: "fa-trash",
          alias: "remove font",
          available: async (): Promise<boolean> => {
            return await FileStorage.hasFile("LocalFontFamilyFile");
          },
          exec: async (): Promise<void> => {
            try {
              await FileStorage.deleteFile("LocalFontFamilyFile");
              await updateUI();
              await applyFontFamily();
            } catch (e) {
              Notifications.add(
                "Error removing font: " + (e as Error).message,
                0,
              );
            }
          },
        },
      ],
    },
  });
}

const commands: Command[] = [fromMeta];

export default commands;
