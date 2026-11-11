import { createEffect, createSignal, JSXElement, on, Show } from "solid-js";

import { getConfig } from "../../config/store";
import { showNoticeNotification } from "../../states/notifications";
import { setErrorBorderDisabled } from "../../states/test";
import {
  getCustomBackgroundFilterPreview,
  isCustomBackgroundLoaded,
  setCustomBackgroundLoaded,
} from "../../states/theme";
import { cn } from "../../utils/cn";
import fileStorage from "../../utils/file-storage";

export function CustomBackground(): JSXElement {
  const [localFile, setLocalFile] = createSignal<string>();
  createEffect(() => {
    fileStorage.track("LocalBackgroundFile");
    void fileStorage.getFile("LocalBackgroundFile").then(setLocalFile);
  });

  // a local file takes priority over the url
  const url = (): string => localFile() ?? getConfig.customBackground;

  createEffect(() => setErrorBorderDisabled(url() !== ""));
  createEffect(on(url, () => setCustomBackgroundLoaded(false)));

  const style = (): Record<string, string> => {
    const [blur, brightness, saturate, opacity] =
      getCustomBackgroundFilterPreview() ?? getConfig.customBackgroundFilter;
    const filters = [
      blur !== 0 && `blur(${blur}rem)`,
      brightness !== 1 && `brightness(${brightness})`,
      saturate !== 1 && `saturate(${saturate})`,
      opacity !== 1 && `opacity(${opacity})`,
    ].filter(Boolean);
    const size = getConfig.customBackgroundSize;
    return {
      filter: filters.join(" "),
      width: `calc(100% + ${blur * 8}rem)`,
      height: `calc(100% + ${blur * 8}rem)`,
      transform: `scale(${1 + blur / 100})`,
      top: `-${blur * 4}rem`,
      ...(size !== "max" && { "object-fit": size }),
    };
  };

  return (
    // class used by the screenshot
    <div class="customBackground fixed top-0 left-0 -z-999 flex h-screen w-screen items-center justify-center">
      <Show when={url() !== ""}>
        <img
          src={url()}
          alt=""
          class={cn("absolute", { hidden: !isCustomBackgroundLoaded() })}
          style={style()}
          onLoad={() => setCustomBackgroundLoaded(true)}
          onError={() => {
            setCustomBackgroundLoaded(false);
            showNoticeNotification(
              "Custom background link is either temporarily unavailable or expired. Please make sure the URL is correct or change it",
              { durationMs: 5000 },
            );
          }}
        />
      </Show>
    </div>
  );
}
