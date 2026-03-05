import FileStorage from "../../utils/file-storage";
import * as Notifications from "../notifications";
import { applyCustomBackground } from "../../controllers/theme-controller";

const parentEl = document.querySelector(
  ".pageSettings .section[data-config-name='customBackgroundSize']",
);
const usingLocalImageEl = parentEl?.querySelector(".usingLocalImage");
const separatorEl = parentEl?.querySelector(".separator");
const uploadContainerEl = parentEl?.querySelector(".uploadContainer");
const inputAndButtonEl = parentEl?.querySelector(".inputAndButton");

async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function updateUI(): Promise<void> {
  if (await FileStorage.hasFile("LocalBackgroundFile")) {
    usingLocalImageEl?.classList.remove("hidden");
    separatorEl?.classList.add("hidden");
    uploadContainerEl?.classList.add("hidden");
    inputAndButtonEl?.classList.add("hidden");
  } else {
    usingLocalImageEl?.classList.add("hidden");
    separatorEl?.classList.remove("hidden");
    uploadContainerEl?.classList.remove("hidden");
    inputAndButtonEl?.classList.remove("hidden");
  }
}

usingLocalImageEl
  ?.querySelector("button")
  ?.addEventListener("click", async () => {
    await FileStorage.deleteFile("LocalBackgroundFile");
    await updateUI();
    await applyCustomBackground();
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
    if (!/image\/(jpeg|jpg|png|gif|webp)/.exec(file.type)) {
      Notifications.add("Unsupported image format", 0);
      fileInput.value = "";
      return;
    }

    const dataUrl = await readFileAsDataURL(file);
    await FileStorage.storeFile("LocalBackgroundFile", dataUrl);

    await updateUI();
    await applyCustomBackground();

    fileInput.value = "";
  });
