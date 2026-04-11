import { For, JSXElement, Show } from "solid-js";
import { debounce } from "throttle-debounce";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import {
  ColorName,
  ThemesList,
  ThemeWithName,
} from "../../../../constants/themes";
import {
  convertCustomColorsToTheme,
  convertThemeToCustomColors,
} from "../../../../controllers/theme-controller";
import { createEffectOn } from "../../../../hooks/effects";
import {
  showNoticeNotification,
  showSuccessNotification,
} from "../../../../states/notifications";
import { showSimpleModal } from "../../../../states/simple-modal";
import { getTheme, setTheme, updateThemeColor } from "../../../../states/theme";
import { cn } from "../../../../utils/cn";
import { hexToHSL } from "../../../../utils/colors";
import { AnimeConditional } from "../../../common/anime";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { Separator } from "../../../common/Separator";
import { Setting } from "../Setting";

export const sortedThemes: ThemeWithName[] = [...ThemesList].sort((a, b) => {
  const b1 = hexToHSL(a.bg);
  const b2 = hexToHSL(b.bg);
  return b2.lgt - b1.lgt;
});

export function Theme(): JSXElement {
  const Presets = () => (
    <div class="grid gap-4">
      <Show when={getConfig.favThemes.length > 0}>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2">
          <For
            each={sortedThemes.filter((t) =>
              getConfig.favThemes.includes(t.name),
            )}
          >
            {(theme) => <ThemeButton theme={theme} />}
          </For>
        </div>
      </Show>
      <Show when={getConfig.favThemes.length > 0}>
        <Separator />
      </Show>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2">
        <For
          each={sortedThemes.filter(
            (t) => !getConfig.favThemes.includes(t.name),
          )}
        >
          {(theme) => <ThemeButton theme={theme} />}
        </For>
      </div>
    </div>
  );

  const Customs = () => (
    <div class="grid gap-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Picker color="bg" />
        <Picker color="main" />
        <Picker color="sub" />
        <Picker color="text" />
        <Picker color="caret" />
        <Picker color="subAlt" />
        <Picker color="error" />
        <Picker color="errorExtra" />
        <div class="col-span-1 text-sub md:col-span-2">
          when colorful mode is enabled:
        </div>
        <Picker color="colorfulError" />
        <Picker color="colorfulErrorExtra" />
      </div>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          text="load from preset"
          onClick={() => {
            const presetTheme = ThemesList.find(
              (t) => t.name === getConfig.theme,
            );
            if (presetTheme) {
              setTheme({ ...presetTheme, name: "custom" });
            } else {
              showSuccessNotification("Current preset theme not found");
            }
          }}
        />
        <Button
          text="share"
          onClick={() => {
            showSimpleModal({
              title: "Share custom theme",
              inputs: [
                {
                  label: "Include background link, size and filters",
                  type: "checkbox",
                },
              ],
              buttonText: "copy link to clipboard",
              buttonAlwaysEnabled: true,
              execFn: async (includeBackground) => {
                const newTheme: {
                  c: string[]; //colors
                  i?: string; //image
                  s?: string; //size
                  f?: object; //filter
                } = {
                  c: convertThemeToCustomColors(getTheme()),
                };

                if (includeBackground) {
                  newTheme.i = getConfig.customBackground;
                  newTheme.s = getConfig.customBackgroundSize;
                  newTheme.f = getConfig.customBackgroundFilter;
                }

                const link =
                  window.location.origin +
                  "?customTheme=" +
                  btoa(JSON.stringify(newTheme));

                try {
                  await navigator.clipboard.writeText(link);
                  showSuccessNotification("URL Copied to clipboard");
                } catch (e) {
                  showNoticeNotification(
                    "Looks like we couldn't copy the link straight to your clipboard. Please copy it manually.",
                    {
                      durationMs: 5000,
                    },
                  );

                  setTimeout(() => {
                    showSimpleModal({
                      title: "Custom theme URL",
                      class: "max-w-2xl",
                      inputs: [
                        {
                          type: "textarea",
                          placeholder: "URL",
                          initVal: link,
                          clickToSelect: true,
                          readOnly: true,
                          class: "h-50",
                        },
                      ],
                      execFn: async () => {
                        return {
                          status: "success",
                          message: "Copied",
                          showNotification: false,
                        };
                      },
                    });
                  }, 250);
                  // this is flaky, no chaining for simple modals
                }

                return {
                  status: "success",
                  message: "Copied",
                  showNotification: false,
                };
              },
            });
          }}
        />
        <Button
          text="save"
          onClick={() => {
            setConfig(
              "customThemeColors",
              convertThemeToCustomColors(getTheme()),
            );
            showSuccessNotification("Custom theme colors saved");
          }}
        />
      </div>
    </div>
  );

  createEffectOn(
    () => getConfig.customTheme,
    (custom) => {
      if (custom) {
        const colorsObj = convertCustomColorsToTheme(
          getConfig.customThemeColors,
        );
        setTheme({ ...colorsObj, name: "custom" });
      }
    },
  );

  return (
    <Setting
      title={configMetadata.theme.displayString ?? "theme"}
      fa={configMetadata.theme.fa}
      description={configMetadata.theme.description}
      inputs={
        <div class="grid w-full grid-cols-2 gap-2">
          <Button
            onClick={() => setConfig("customTheme", false)}
            active={!getConfig.customTheme}
            text="preset"
          />
          <Button
            onClick={() => setConfig("customTheme", true)}
            active={getConfig.customTheme}
            text="custom"
          />
        </div>
      }
      fullWidthInputs={
        <AnimeConditional
          exitBeforeEnter
          if={!getConfig.customTheme}
          then={<Presets />}
          else={<Customs />}
        />
      }
    />
  );
}

function ThemeButton(props: { theme: ThemeWithName }): JSXElement {
  const isActive = () => getConfig.theme === props.theme.name;
  const isFav = () => getConfig.favThemes.includes(props.theme.name);

  return (
    <button
      type="button"
      style={{
        "--bg": props.theme.bg,
        "--main": props.theme.main,
        "--sub": props.theme.sub,
        "--text": props.theme.text,
      }}
      class={cn(
        "group/theme grid grid-cols-[1fr_auto_1fr] justify-between p-1 ring-4 ring-transparent",
        "bg-(--bg) text-(--main)",
        // "hover:bg-(--text) hover:text-(--bg)",
        "hover:ring-(--main)",
        "transition-[opacity,color,background,box-shadow] duration-125",
        isActive() && "ring-4 ring-(--main)",
      )}
      onClick={() => {
        if (isActive()) return;
        setConfig("theme", props.theme.name);
      }}
    >
      <div
        class={cn(
          "align-center place-self-start opacity-0 transition-[opacity,color,background] duration-125 group-hover/theme:opacity-100",
          isFav() && "opacity-100",
        )}
      >
        <div
          class={cn(
            "grid justify-center",
            "rounded-full bg-(--bg) p-1",
            // "group-hover/theme:text-(--text)",
            "transition-[opacity,color,background] duration-125",
            "hover:text-(--text)",
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (isFav()) {
              setConfig(
                "favThemes",
                getConfig.favThemes.filter((t) => t !== props.theme.name),
              );
            } else {
              setConfig("favThemes", [
                ...getConfig.favThemes,
                props.theme.name,
              ]);
            }
          }}
        >
          <Fa
            icon="fa-star"
            variant={isFav() ? "solid" : "regular"}
            fixedWidth
            class="transition-[opacity,color,background] duration-125"
          />
        </div>
      </div>
      <div>{props.theme.name.replace(/_/g, " ")}</div>
      <div
        class={cn(
          "place-self-end self-center opacity-0 transition-opacity duration-125 group-hover/theme:opacity-100",
          isActive() && "opacity-100",
        )}
      >
        <div class="grid grid-cols-3 gap-2 rounded-full bg-(--bg) p-1.5">
          <div class="h-4 w-4 rounded-full bg-(--main)"></div>
          <div class="h-4 w-4 rounded-full bg-(--sub)"></div>
          <div class="h-4 w-4 rounded-full bg-(--text)"></div>
        </div>
      </div>
    </button>
  );
}

function Picker(props: { color: ColorName }): JSXElement {
  let colorInputRef: HTMLInputElement | undefined = undefined;

  const text = () => {
    if (props.color === "bg") return "background";
    if (props.color === "main") return "main";
    if (props.color === "sub") return "sub";
    if (props.color === "subAlt") return "sub alt";
    if (props.color === "caret") return "caret";
    if (props.color === "text") return "text";
    if (props.color === "error") return "error";
    if (props.color === "errorExtra") return "extra error";
    if (props.color === "colorfulError") return "error";
    if (props.color === "colorfulErrorExtra") return "extra error";
    return "unknown";
  };

  const _classes = [
    "bg-(--picker-bg)",
    "bg-(--picker-main)",
    "bg-(--picker-caret)",
    "bg-(--picker-sub)",
    "bg-(--picker-subAlt)",
    "bg-(--picker-text)",
    "bg-(--picker-error)",
    "bg-(--picker-errorExtra)",
    "bg-(--picker-colorfulError)",
    "bg-(--picker-colorfulErrorExtra)",
  ];

  // oxlint-disable-next-line solid/reactivity
  const debouncedInput = debounce(125, (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    const color = target.value;
    const key = props.color;

    updateThemeColor(key, color);
  });

  return (
    <div
      class="grid w-full grid-cols-[1fr_1fr_min-content] items-center gap-2"
      style={{
        "--picker-bg": getTheme().bg,
        "--picker-main": getTheme().main,
        "--picker-caret": getTheme().caret,
        "--picker-sub": getTheme().sub,
        "--picker-subAlt": getTheme().subAlt,
        "--picker-text": getTheme().text,
        "--picker-error": getTheme().error,
        "--picker-errorExtra": getTheme().errorExtra,
        "--picker-colorfulError": getTheme().colorfulError,
        "--picker-colorfulErrorExtra": getTheme().colorfulErrorExtra,
      }}
    >
      <div>{text()}</div>
      <input
        ref={(el) => (colorInputRef = el)}
        type="color"
        value={getTheme()[props.color]}
        onInput={debouncedInput}
        // onChange={(e) => {
        //   const current = [...getConfig.customThemeColors];
        //   current[colorIndex()] = e.currentTarget.value;
        //   setConfig(
        //     "customThemeColors",
        //     current as typeof getConfig.customThemeColors,
        //   );
        // }}
      />
      <input
        // class="text-center"
        type="text"
        value={getTheme()[props.color]}
        onChange={(e) => {
          const value = e.currentTarget.value;
          if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) {
            // invalid hex color
            e.currentTarget.value = getTheme()[props.color];
            return;
          }
          updateThemeColor(props.color, value);
        }}
      />
      <Button
        class={cn(
          `bg-(--picker-${props.color}) text-(--picker-bg)`,
          `hover:bg-(--picker-text)`,
          props.color === "bg" && "bg-(--picker-subAlt) text-(--picker-text)",
          props.color === "subAlt" && "text-(--picker-text)",
        )}
        fa={{
          icon: "fa-palette",
          fixedWidth: true,
        }}
        onClick={() => colorInputRef?.click()}
      />
    </div>
  );
}
