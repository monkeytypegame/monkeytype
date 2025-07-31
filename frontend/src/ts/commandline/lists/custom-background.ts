import { Command } from "../types";
import FileStorage from "../../utils/file-storage";
import { applyCustomBackground } from "../../controllers/theme-controller";
import { updateUI } from "../../elements/settings/custom-background-picker";

const commands: Command[] = [
  {
    id: "customBackgroundLocal",
    display: "Custom local background...",
    icon: "fa-image",
    alias: "upload background image",
    available: async (): Promise<boolean> => {
      return await FileStorage.hasFile("LocalBackgroundFile");
    },
    exec: async (): Promise<void> => {
      const inputElement = document.createElement("input");
      inputElement.type = "file";
      inputElement.accept = "image/*";
      inputElement.style.display = "none";
      document.body.appendChild(inputElement);

      inputElement.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (readerEvent) => {
            const dataUrl = readerEvent.target?.result as string;
            try {
              await FileStorage.storeFile("LocalBackgroundFile", dataUrl);
              await applyCustomBackground();
              await updateUI();
            } catch (e) {}
            document.body.removeChild(inputElement);
          };
          reader.onerror = () => {
            document.body.removeChild(inputElement);
          };
          reader.readAsDataURL(file);
        } else {
          document.body.removeChild(inputElement);
        }
      };
      inputElement.click();
    },
  },
  {
    id: "removeLocalBackground",
    display: "Remove local background...",
    icon: "fa-times",
    alias: "remove background image",
    available: async (): Promise<boolean> => {
      return !(await FileStorage.hasFile("LocalBackgroundFile"));
    },
    exec: async (): Promise<void> => {
      await FileStorage.deleteFile("LocalBackgroundFile");
      await updateUI();
      await applyCustomBackground();
    },
  },
];

export default commands;
