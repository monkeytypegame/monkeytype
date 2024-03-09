import * as ThemeController from "../controllers/theme-controller";
import Config from "../config";
import * as Notifications from "../elements/notifications";
import * as CustomThemePopup from "../popups/custom-theme-popup";
import { createErrorMessage } from "../utils/misc";
import AnimatedModal from "../utils/animated-modal";

type State = {
  includeBackground: boolean;
};

const state: State = {
  includeBackground: false,
};

export function show(): void {
  void modal.show({
    beforeAnimation: async (m) => {
      (m.querySelector("input[type='checkbox']") as HTMLInputElement).checked =
        false;
      state.includeBackground = false;
    },
  });
}

async function generateUrl(): Promise<string> {
  const newTheme: {
    c: string[]; //colors
    i?: string; //image
    s?: string; //size
    f?: object; //filter
  } = {
    c: ThemeController.colorVars.map(
      (color) =>
        $(
          `.pageSettings .customTheme .customThemeEdit #${color}[type='color']`
        ).attr("value") as string
    ),
  };

  if (state.includeBackground) {
    newTheme.i = Config.customBackground;
    newTheme.s = Config.customBackgroundSize;
    newTheme.f = Config.customBackgroundFilter;
  }

  return (
    window.location.origin + "?customTheme=" + btoa(JSON.stringify(newTheme))
  );
}

async function copy(): Promise<void> {
  const url = await generateUrl();

  navigator.clipboard.writeText(url).then(
    function () {
      Notifications.add("URL Copied to clipboard", 1);
      void modal.hide();
    },
    function (e) {
      Notifications.add(
        createErrorMessage(e, "Failed to copy to clipboard"),
        -1
      );
      Notifications.add(
        "Looks like we couldn't copy the link straight to your clipboard. Please copy it manually.",
        0,
        {
          duration: 5,
        }
      );
      void modal.hide();
      CustomThemePopup.show(url);
    }
  );
}

const modal = new AnimatedModal("shareCustomThemeModal", "popups", undefined, {
  setup: (modal): void => {
    modal.querySelector("button")?.addEventListener("click", copy);
    modal
      .querySelector("input[type='checkbox']")
      ?.addEventListener("change", (e) => {
        state.includeBackground = (e.target as HTMLInputElement).checked;
      });
  },
});
