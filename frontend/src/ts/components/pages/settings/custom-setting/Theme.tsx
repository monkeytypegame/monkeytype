import { createSignal, For, JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { getConfig } from "../../../../config/store";
import { ThemesList, ThemeWithName } from "../../../../constants/themes";
import { cn } from "../../../../utils/cn";
import { hexToHSL } from "../../../../utils/colors";
import { AnimeConditional } from "../../../common/anime";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { Setting } from "../Setting";

export const sortedThemes: ThemeWithName[] = [...ThemesList].sort((a, b) => {
  const b1 = hexToHSL(a.bg);
  const b2 = hexToHSL(b.bg);
  return b2.lgt - b1.lgt;
});

export function Theme(): JSXElement {
  const [currentTab, setCurrentTab] = createSignal<"preset" | "custom">(
    "preset",
  );

  return (
    <Setting
      title={configMetadata.theme.displayString ?? "theme"}
      fa={configMetadata.theme.fa}
      description={configMetadata.theme.description}
      inputs={
        <div class="grid w-full grid-cols-2 gap-2">
          <Button
            onClick={() => setCurrentTab("preset")}
            active={currentTab() === "preset"}
            text="preset"
          />
          <Button
            onClick={() => setCurrentTab("custom")}
            active={currentTab() === "custom"}
            text="custom"
          />
        </div>
      }
      fullWidthInputs={
        <AnimeConditional
          exitBeforeEnter
          if={currentTab() === "preset"}
          then={
            <div class="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2">
              <For each={sortedThemes}>
                {(theme) => (
                  <ThemeButton
                    name={theme.name}
                    theme={theme}
                    active={getConfig.theme === theme.name}
                  />
                )}
              </For>
            </div>
          }
          else={<>custom</>}
        />
      }
    />
  );
}

function ThemeButton(props: {
  name: string;
  theme: ThemeWithName;
  active?: boolean;
  favorite?: boolean;
}): JSXElement {
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
        props.active && "ring-4 ring-(--main)",
      )}
    >
      <div
        class={cn(
          "align-center place-self-start opacity-0 transition-[opacity,color,background] duration-125 group-hover/theme:opacity-100",
          props.favorite && "opacity-100",
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
        >
          <Fa
            icon="fa-star"
            variant="regular"
            fixedWidth
            class="transition-[opacity,color,background] duration-125"
          />
        </div>
      </div>
      <div>{props.name.replace(/_/g, " ")}</div>
      <div
        class={cn(
          "place-self-end self-center opacity-0 transition-opacity duration-125 group-hover/theme:opacity-100",
          props.active && "opacity-100",
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
