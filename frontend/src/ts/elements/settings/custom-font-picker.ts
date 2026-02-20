import FileStorage from "../../utils/file-storage";
import * as Notifications from "../notifications";
import { applyFontFamily } from "../../controllers/theme-controller";

const parentEl = document.querySelector(
  ".pageSettings .section[data-config-name='fontFamily']",
);
const usingLocalFontEl = parentEl?.querySelector(".usingLocalFont");
const separatorEl = parentEl?.querySelector(".separator");
const uploadContainerEl = parentEl?.querySelector(".uploadContainer");
const inputAndButtonEl = parentEl?.querySelector(".buttons");

async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function updateUI(): Promise<void> {
  if (await FileStorage.hasFile("LocalFontFamilyFile")) {
    usingLocalFontEl?.classList.remove("hidden");
    separatorEl?.classList.add("hidden");
    uploadContainerEl?.classList.add("hidden");
    inputAndButtonEl?.classList.add("hidden");
  } else {
    usingLocalFontEl?.classList.add("hidden");
    separatorEl?.classList.remove("hidden");
    uploadContainerEl?.classList.remove("hidden");
    inputAndButtonEl?.classList.remove("hidden");
  }
}

usingLocalFontEl
  ?.querySelector("button")
  ?.addEventListener("click", async () => {
    await FileStorage.deleteFile("LocalFontFamilyFile");
    await updateUI();
    await applyFontFamily();
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
    if (
      !/font\/(woff|woff2|ttf|otf)/.exec(file.type) &&
      !/\.(woff|woff2|ttf|otf)$/i.exec(file.name)
    ) {
      Notifications.add(
        "Unsupported font format, must be woff, woff2, ttf or otf.",
        0,
      );
      fileInput.value = "";
      return;
    }

    const dataUrl = await readFileAsDataURL(file);
    await FileStorage.storeFile("LocalFontFamilyFile", dataUrl);

    await updateUI();
    await applyFontFamily();

    fileInput.value = "";
  });
