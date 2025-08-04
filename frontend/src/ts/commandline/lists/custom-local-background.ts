import { Command } from "../types";
import FileStorage from "../../utils/file-storage";
import { applyCustomBackground } from "../../controllers/theme-controller";
import { updateUI } from "../../elements/settings/custom-background-picker";
import * as Notifications from "../../elements/notifications";

const commands: Command[] = [
  {
    id: "customLocalBackground",
    display: "Custom local background...",
    icon: "fa-image",
    alias: "upload background image",
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
        if (!file.type.match(/image\//)) {
          Notifications.add("Unsupported file format, must be an image.", 0);
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
    display: "Remove local background...",
    icon: "fa-trash",
    alias: "remove background image",
    available: async (): Promise<boolean> => {
      return await FileStorage.hasFile("LocalBackgroundFile");
    },
    exec: async (): Promise<void> => {
      try {
        await FileStorage.deleteFile("LocalBackgroundFile");
        await updateUI();
        await applyCustomBackground();
      } catch (e) {
        Notifications.add(
          "Error removing background: " + (e as Error).message,
          0
        );
      }
    },
  },
];

export default commands;
