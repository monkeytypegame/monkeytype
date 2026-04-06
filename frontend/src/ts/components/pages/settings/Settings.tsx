import { Config, ConfigSchema } from "@monkeytype/schemas/configs";
import { createSignal, For, JSXElement } from "solid-js";

import { configMetadata } from "../../../config/metadata";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { cn } from "../../../utils/cn";
import { getOptions } from "../../../utils/zod";
import { Anime, AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { Setting } from "./Setting";

export function Settings(): JSXElement {
  return (
    <div class="outline">
      <Section title="behavior">
        <KeyedSetting key="resultSaving" autoInputs />
        <KeyedSetting key="difficulty" autoInputs />
        <KeyedSetting key="quickRestart" autoInputs />
        <KeyedSetting key="repeatQuotes" autoInputs />
        <KeyedSetting key="blindMode" autoInputs />
        <KeyedSetting key="alwaysShowWordsHistory" autoInputs />
        <KeyedSetting key="singleListCommandLine" autoInputs />
        {/* todo: min speed */}
        {/* todo: min accuracy */}
        {/* todo: min burst */}
        <KeyedSetting key="britishEnglish" autoInputs />
        {/* todo: language */}
        {/* todo: funbox */}
        {/* todo: custom layoutfluid */}
        {/* todo: polyglot languages */}
      </Section>
      <Section title="input">
        <KeyedSetting key="freedomMode" autoInputs />
        <KeyedSetting key="strictSpace" autoInputs />
        <KeyedSetting key="oppositeShiftMode" autoInputs />
        <KeyedSetting key="stopOnError" autoInputs />
        <KeyedSetting key="confidenceMode" autoInputs />
        <KeyedSetting key="quickEnd" autoInputs />
        <KeyedSetting key="indicateTypos" autoInputs />
        <KeyedSetting key="hideExtraLetters" autoInputs />
        <KeyedSetting key="compositionDisplay" autoInputs />
        <KeyedSetting key="lazyMode" autoInputs />
        {/* todo: layout emulator */}
        <KeyedSetting key="codeUnindentOnBackspace" autoInputs />
      </Section>
      <Section title="sound">
        {/* todo: sound volume */}
        <KeyedSetting key="playSoundOnClick" autoInputs autoWide />
        <KeyedSetting key="playSoundOnError" autoInputs autoWide />
        <KeyedSetting key="playTimeWarning" autoInputs autoWide />
      </Section>
      <Section title="caret">
        <KeyedSetting key="smoothCaret" autoInputs />
        <KeyedSetting key="caretStyle" autoInputs />
        {/* pace caret */}
        <KeyedSetting key="repeatedPace" autoInputs />
        <KeyedSetting key="paceCaretStyle" autoInputs />
      </Section>
      <Section title="appearance">
        <KeyedSetting key="timerStyle" autoInputs autoWide />
        <KeyedSetting key="liveSpeedStyle" autoInputs />
        <KeyedSetting key="liveAccStyle" autoInputs />
        <KeyedSetting key="liveBurstStyle" autoInputs />
        <KeyedSetting key="timerColor" autoInputs />
        <KeyedSetting key="timerOpacity" autoInputs />
        <KeyedSetting key="highlightMode" autoInputs autoWide />
        <KeyedSetting key="typedEffect" autoInputs />
        <KeyedSetting key="tapeMode" autoInputs />
        {/* todo: tape margin */}
        <KeyedSetting key="smoothLineScroll" autoInputs />
        <KeyedSetting key="showAllLines" autoInputs />
        <KeyedSetting key="alwaysShowDecimalPlaces" autoInputs />
        <KeyedSetting key="typingSpeedUnit" autoInputs />
        <KeyedSetting key="startGraphsAtZero" autoInputs />
        {/* todo: max line width */}
        {/* todo: font size */}
        {/* todo: font family */}
        <KeyedSetting key="keymapMode" autoInputs />
        {/* todo: keymap layout */}
        <KeyedSetting key="keymapStyle" autoInputs autoWide />
        <KeyedSetting key="keymapLegendStyle" autoInputs autoWide />
        <KeyedSetting key="keymapShowTopRow" autoInputs autoWide />
        {/* todo: keymap size */}
      </Section>
      <Section title="theme">
        <KeyedSetting key="flipTestColors" autoInputs />
        <KeyedSetting key="colorfulMode" autoInputs />
        {/* todo: custom background (url + local image + size) */}
        {/* todo: custom background filter */}
        <KeyedSetting key="autoSwitchTheme" autoInputs />
        {/* todo: auto switch theme inputs (light/dark selects) */}
        <KeyedSetting key="randomTheme" autoInputs autoWide />
        {/* todo: theme picker (preset + custom tabs) */}
      </Section>
      <Section title="hide elements">
        <KeyedSetting key="showKeyTips" autoInputs />
        <KeyedSetting key="showOutOfFocusWarning" autoInputs />
        <KeyedSetting key="capsLockWarning" autoInputs />
        <KeyedSetting key="showAverage" autoInputs />
      </Section>
      {/* todo: danger zone */}
    </div>
  );
}

function Section(props: { title: string; children: JSXElement }): JSXElement {
  const [isOpen, setIsOpen] = createSignal(true);

  return (
    <div>
      <Button
        variant="text"
        class="mb-8 w-max gap-4 p-0 text-4xl"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Anime
          animation={{
            rotate: isOpen() ? 0 : -90,
            duration: 125,
          }}
        >
          <Fa icon="fa-chevron-down" />
        </Anime>
        {props.title}
      </Button>
      <AnimeShow when={isOpen()} slide class="grid gap-8">
        {props.children}
      </AnimeShow>
    </div>
  );
}

function KeyedSetting(props: {
  key: keyof Config;
  inputs?: JSXElement;
  fullWidthInputs?: JSXElement;
  autoInputs?: boolean;
  autoWide?: boolean;
}): JSXElement {
  const autoInputs = () => {
    if (props.autoInputs === true) {
      const options = getOptions(ConfigSchema.shape[props.key]);
      if (options !== undefined) {
        return (
          <div
            class={cn(
              "grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2",
              props.autoWide &&
                "grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))]",
            )}
          >
            <For each={options}>
              {(option) => {
                const text = () => {
                  const optionsMeta = configMetadata[props.key]
                    .optionsMetadata as
                    | Record<string, { displayString?: string }>
                    | undefined;
                  const match = optionsMeta?.[String(option)];
                  if (match?.displayString !== undefined) {
                    return match.displayString;
                  }

                  if (option === true) {
                    return "on";
                  }
                  if (option === false) {
                    return "off";
                  }

                  return option.toString();
                };
                return (
                  <Button
                    active={getConfig[props.key] === option}
                    onClick={() => {
                      if (getConfig[props.key] === option) return;
                      setConfig(props.key, option);
                    }}
                  >
                    {text()}
                  </Button>
                );
              }}
            </For>
          </div>
        );
      }
    }
    return undefined;
  };

  return (
    <Setting
      title={configMetadata[props.key].displayString ?? props.key}
      fa={configMetadata[props.key].fa}
      description={configMetadata[props.key].description}
      inputs={!props.autoWide ? autoInputs() : props.inputs}
      fullWidthInputs={
        props.autoWide
          ? (autoInputs() ?? props.fullWidthInputs)
          : props.fullWidthInputs
      }
    />
  );
}
