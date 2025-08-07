import { Command } from "../types";
import { buildCommandForConfigKey } from "../util";
import FileStorage from "../../utils/file-storage";
import { applyCustomBackground } from "../../controllers/theme-controller";
import * as Notifications from "../../elements/notifications";

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
        icon: "fa-upload",
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
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
              Notifications.add("Unsupported image format", 0);
              cleanup();
              return;
            }

            const reader = new FileReader();
            reader.onload = async (readerEvent) => {
              const dataUrl = readerEvent.target?.result as string;
              try {
                await FileStorage.storeFile("LocalBackgroundFile", dataUrl);
                await applyCustomBackground();
              } catch (e) {
                Notifications.add(
                  "Error uploading background: " + (e as Error).message,
                  0
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
        id: "removeLocalBackground",
        display: "Remove local background",
        icon: "fa-trash",
        alias: "remove background",
        available: async (): Promise<boolean> => {
          return await FileStorage.hasFile("LocalBackgroundFile");
        },
        exec: async (): Promise<void> => {
          try {
            await FileStorage.deleteFile("LocalBackgroundFile");
            await applyCustomBackground();
          } catch (e) {
            Notifications.add(
              "Error removing background: " + (e as Error).message,
              0
            );
          }
        },
      },
    ],
  },
};

const commands: Command[] = [customBackgroundCommand];

export default commands;
