import { Command } from "../types";
import { buildCommandForConfigKey } from "../util";
import FileStorage from "../../utils/file-storage";
import { applyCustomBackground } from "../../controllers/theme-controller";
import { updateUI } from "../../elements/settings/custom-background-picker";
import { showNoticeNotification } from "../../states/notifications";
import { Config } from "../../config/store";
import { setConfig } from "../../config/setters";

const fromMeta = buildCommandForConfigKey("customBackground");

const customBackgroundCommand: Command = {
  id: "customBackground",
  display: "Custom background...",
  icon: "fa-image",
  subgroup: {
    title: "Custom background...",
    list: [
      fromMeta,
      {
        id: "customLocalBackground",
        display: "Local background...",
        icon: "fa-file-import fa-fw",
        alias: "upload background",
        available: async (): Promise<boolean> => {
          return !(await FileStorage.hasFile("LocalBackgroundFile"));
        },
        exec: async (): Promise<void> => {
          const inputElement = document.createElement("input");
          inputElement.type = "file";
          inputElement.accept = "image/*";
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
            if (!/image\/(jpeg|jpg|png|gif|webp)/.exec(file.type)) {
              showNoticeNotification("Unsupported image format");
              cleanup();
              return;
            }

            const reader = new FileReader();
            reader.onload = async (readerEvent) => {
              const dataUrl = readerEvent.target?.result as string;
              try {
                await FileStorage.storeFile("LocalBackgroundFile", dataUrl);
                await applyCustomBackground();
                await updateUI();
              } catch (e) {
                showNoticeNotification(
                  "Error uploading background: " + (e as Error).message,
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
        id: "removeCustomBackground",
        display: "Remove custom background",
        icon: "fa-trash",
        available: async (): Promise<boolean> => {
          return (
            (await FileStorage.hasFile("LocalBackgroundFile")) ||
            Config.customBackground !== ""
          );
        },
        exec: async (): Promise<void> => {
          try {
            await FileStorage.deleteFile("LocalBackgroundFile");
            setConfig("customBackground", "");
            await applyCustomBackground();
            await updateUI();
          } catch (e) {
            showNoticeNotification(
              "Error removing background: " + (e as Error).message,
            );
          }
        },
      },
    ],
  },
};

const commands: Command[] = [customBackgroundCommand];

export default commands;
