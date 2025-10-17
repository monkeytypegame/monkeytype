import FileStorage from "../../utils/file-storage";
import * as Notifications from "../notifications";
import { keymapToString, stringToKeymap } from "../../utils/custom-keymap";
import * as UpdateConfig from "../../config";
import { KeymapCustom } from "@monkeytype/schemas/configs";

const parentEl = document.querySelector(
  ".pageSettings .section[data-config-name='keymapCustom']"
);
const usingLocalKeymapEl = parentEl?.querySelector(".usingLocalKeymap");
const separatorEl = parentEl?.querySelector(".separator");
const uploadContainerEl = parentEl?.querySelector(".uploadContainer");
const inputAndButtonEl = parentEl?.querySelector(".textareaAndButton");

async function readFileAsData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function applyCustomKeymap(keymap: KeymapCustom): Promise<void> {
  $(
    ".pageSettings .section[data-config-name='keymapCustom'] .textareaAndButton textarea"
  ).val("");
  const didConfigSave = UpdateConfig.setKeymapCustom(keymap);
  if (didConfigSave) {
    Notifications.add("Saved", 1, {
      duration: 1,
    });
  }
}

export async function updateUI(): Promise<void> {
  if (await FileStorage.hasFile("LocalKeymapFile")) {
    usingLocalKeymapEl?.classList.remove("hidden");
    separatorEl?.classList.add("hidden");
    uploadContainerEl?.classList.add("hidden");
    inputAndButtonEl?.classList.add("hidden");
  } else {
    usingLocalKeymapEl?.classList.add("hidden");
    separatorEl?.classList.remove("hidden");
    uploadContainerEl?.classList.remove("hidden");
    inputAndButtonEl?.classList.remove("hidden");
  }
}

usingLocalKeymapEl
  ?.querySelector("button")
  ?.addEventListener("click", async () => {
    await FileStorage.deleteFile("LocalKeymapFile");
    await updateUI();
    await applyCustomKeymap([]);
  });

uploadContainerEl
  ?.querySelector("input[type='file']")
  ?.addEventListener("change", async (e) => {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      return;
    }

    // check type
    if (!file.type.match(/application\/json/)) {
      Notifications.add("Unsupported keymap format", 0);
      fileInput.value = "";
      return;
    }

    //sanitize input
    const data = await readFileAsData(file);
    const keymapData = stringToKeymap(data);
    await FileStorage.storeFile("LocalKeymapFile", keymapToString(keymapData));

    await updateUI();
    await applyCustomKeymap(keymapData);

    fileInput.value = "";
  });
