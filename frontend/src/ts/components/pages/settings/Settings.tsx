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
import { Funbox } from "./custom-setting/Funbox";
import { Language } from "./custom-setting/Language";
import { MinAcc } from "./custom-setting/MinAcc";
import { MinBurst } from "./custom-setting/MinBurst";
import { MinSpeed } from "./custom-setting/MinSpeed";
import { Setting } from "./Setting";

export function Settings(): JSXElement {
  return (
    <div class="outline">
      <Section title="behavior">
        <KeyedAutoSetting key="resultSaving" />
        <KeyedAutoSetting key="difficulty" />
        <KeyedAutoSetting key="quickRestart" />
        <KeyedAutoSetting key="repeatQuotes" />
        <KeyedAutoSetting key="blindMode" />
        <KeyedAutoSetting key="alwaysShowWordsHistory" />
        <KeyedAutoSetting key="singleListCommandLine" />
        <MinSpeed />
        <MinAcc />
        <MinBurst />
        <KeyedAutoSetting key="britishEnglish" />
        <Language />
        <Funbox />
        {/* todo: custom layoutfluid */}
        {/* todo: polyglot languages */}
      </Section>
      <Section title="input">
        <KeyedAutoSetting key="freedomMode" />
        <KeyedAutoSetting key="strictSpace" />
        <KeyedAutoSetting key="oppositeShiftMode" />
        <KeyedAutoSetting key="stopOnError" />
        <KeyedAutoSetting key="confidenceMode" />
        <KeyedAutoSetting key="quickEnd" />
        <KeyedAutoSetting key="indicateTypos" />
        <KeyedAutoSetting key="hideExtraLetters" />
        <KeyedAutoSetting key="compositionDisplay" />
        <KeyedAutoSetting key="lazyMode" />
        {/* todo: layout emulator */}
        <KeyedAutoSetting key="codeUnindentOnBackspace" />
      </Section>
      <Section title="sound">
        {/* todo: sound volume */}
        <KeyedAutoSetting key="playSoundOnClick" wide />
        <KeyedAutoSetting key="playSoundOnError" wide />
        <KeyedAutoSetting key="playTimeWarning" wide />
      </Section>
      <Section title="caret">
        <KeyedAutoSetting key="smoothCaret" />
        <KeyedAutoSetting key="caretStyle" wide />
        {/* pace caret */}
        <KeyedAutoSetting key="paceCaretStyle" wide />
        <KeyedAutoSetting key="repeatedPace" />
      </Section>
      <Section title="appearance">
        <KeyedAutoSetting key="timerStyle" wide />
        <KeyedAutoSetting key="liveSpeedStyle" />
        <KeyedAutoSetting key="liveAccStyle" />
        <KeyedAutoSetting key="liveBurstStyle" />
        <KeyedAutoSetting key="timerColor" />
        <KeyedAutoSetting key="timerOpacity" />
        <KeyedAutoSetting key="highlightMode" wide />
        <KeyedAutoSetting key="typedEffect" />
        <KeyedAutoSetting key="tapeMode" />
        {/* todo: tape margin */}
        <KeyedAutoSetting key="smoothLineScroll" />
        <KeyedAutoSetting key="showAllLines" />
        <KeyedAutoSetting key="alwaysShowDecimalPlaces" />
        <KeyedAutoSetting key="typingSpeedUnit" />
        <KeyedAutoSetting key="startGraphsAtZero" />
        {/* todo: max line width */}
        {/* todo: font size */}
        {/* todo: font family */}
        <KeyedAutoSetting key="keymapMode" />
        {/* todo: keymap layout */}
        <KeyedAutoSetting key="keymapStyle" wide />
        <KeyedAutoSetting key="keymapLegendStyle" wide />
        <KeyedAutoSetting key="keymapShowTopRow" wide />
        {/* todo: keymap size */}
      </Section>
      <Section title="theme">
        <KeyedAutoSetting key="flipTestColors" />
        <KeyedAutoSetting key="colorfulMode" />
        {/* todo: custom background (url + local image + size) */}
        {/* todo: custom background filter */}
        <KeyedAutoSetting key="autoSwitchTheme" />
        {/* todo: auto switch theme inputs (light/dark selects) */}
        <KeyedAutoSetting key="randomTheme" wide />
        {/* todo: theme picker (preset + custom tabs) */}
      </Section>
      <Section title="hide elements">
        <KeyedAutoSetting key="showKeyTips" />
        <KeyedAutoSetting key="showOutOfFocusWarning" />
        <KeyedAutoSetting key="capsLockWarning" />
        <KeyedAutoSetting key="showAverage" />
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
        <div class="h-16"></div>
      </AnimeShow>
    </div>
  );
}

function KeyedAutoSetting(props: {
  key: keyof Config;
  inputs?: JSXElement;
  wide?: boolean;
}): JSXElement {
  const autoInputs = () => {
    const options = getOptions(ConfigSchema.shape[props.key]);
    if (options !== undefined) {
      return (
        <div
          class={cn(
            "grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2",
            props.wide && "grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))]",
          )}
        >
          <For each={options}>
            {(option) => {
              const text = () => {
                const optionsMeta = configMetadata[props.key].optionsMetadata as
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

                return option.toString().replace(/_/g, " ");
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
    return undefined;
  };

  return (
    <Setting
      title={configMetadata[props.key].displayString ?? props.key}
      fa={configMetadata[props.key].fa}
      description={configMetadata[props.key].description}
      inputs={!props.wide ? autoInputs() : props.inputs}
      fullWidthInputs={
        props.wide ? (autoInputs() ?? props.inputs) : props.inputs
      }
    />
  );
}
