import { Command } from "../types";
import FileStorage from "../../utils/file-storage";
import { applyFontFamily } from "../../controllers/theme-controller";
import { updateUI } from "../../elements/settings/custom-font-picker";
import * as Notifications from "../../elements/notifications";

const commands: Command[] = [
  {
    id: "customLocalFont",
    display: "Custom local font...",
    icon: "fa-font",
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
          !file.type.match(/font\/(woff|woff2|ttf|otf)/) &&
          !file.name.match(/\.(woff|woff2|ttf|otf)$/i)
        ) {
          Notifications.add(
            "Unsupported font format, must be woff, woff2, ttf or otf.",
            0
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
    id: "removeLocalFont",
    display: "Remove local font...",
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
        Notifications.add("Error removing font: " + (e as Error).message, 0);
      }
    },
  },
];

export default commands;
