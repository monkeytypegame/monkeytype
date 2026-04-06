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
        <KeyedSetting key="resultSaving" />
        <KeyedSetting key="difficulty" />
        <KeyedSetting key="quickRestart" />
        <KeyedSetting key="repeatQuotes" />
        <KeyedSetting key="blindMode" />
        <KeyedSetting key="alwaysShowWordsHistory" />
        <KeyedSetting key="singleListCommandLine" />
        <MinSpeed />
        <MinAcc />
        <MinBurst />
        <KeyedSetting key="britishEnglish" />
        <Language />
        <Funbox />
        {/* todo: custom layoutfluid */}
        {/* todo: polyglot languages */}
      </Section>
      <Section title="input">
        <KeyedSetting key="freedomMode" />
        <KeyedSetting key="strictSpace" />
        <KeyedSetting key="oppositeShiftMode" />
        <KeyedSetting key="stopOnError" />
        <KeyedSetting key="confidenceMode" />
        <KeyedSetting key="quickEnd" />
        <KeyedSetting key="indicateTypos" />
        <KeyedSetting key="hideExtraLetters" />
        <KeyedSetting key="compositionDisplay" />
        <KeyedSetting key="lazyMode" />
        {/* todo: layout emulator */}
        <KeyedSetting key="codeUnindentOnBackspace" />
      </Section>
      <Section title="sound">
        {/* todo: sound volume */}
        <KeyedSetting key="playSoundOnClick" wide />
        <KeyedSetting key="playSoundOnError" wide />
        <KeyedSetting key="playTimeWarning" wide />
      </Section>
      <Section title="caret">
        <KeyedSetting key="smoothCaret" />
        <KeyedSetting key="caretStyle" wide />
        {/* pace caret */}
        <KeyedSetting key="paceCaretStyle" wide />
        <KeyedSetting key="repeatedPace" />
      </Section>
      <Section title="appearance">
        <KeyedSetting key="timerStyle" wide />
        <KeyedSetting key="liveSpeedStyle" />
        <KeyedSetting key="liveAccStyle" />
        <KeyedSetting key="liveBurstStyle" />
        <KeyedSetting key="timerColor" />
        <KeyedSetting key="timerOpacity" />
        <KeyedSetting key="highlightMode" wide />
        <KeyedSetting key="typedEffect" />
        <KeyedSetting key="tapeMode" />
        {/* todo: tape margin */}
        <KeyedSetting key="smoothLineScroll" />
        <KeyedSetting key="showAllLines" />
        <KeyedSetting key="alwaysShowDecimalPlaces" />
        <KeyedSetting key="typingSpeedUnit" />
        <KeyedSetting key="startGraphsAtZero" />
        {/* todo: max line width */}
        {/* todo: font size */}
        {/* todo: font family */}
        <KeyedSetting key="keymapMode" />
        {/* todo: keymap layout */}
        <KeyedSetting key="keymapStyle" wide />
        <KeyedSetting key="keymapLegendStyle" wide />
        <KeyedSetting key="keymapShowTopRow" wide />
        {/* todo: keymap size */}
      </Section>
      <Section title="theme">
        <KeyedSetting key="flipTestColors" />
        <KeyedSetting key="colorfulMode" />
        {/* todo: custom background (url + local image + size) */}
        {/* todo: custom background filter */}
        <KeyedSetting key="autoSwitchTheme" />
        {/* todo: auto switch theme inputs (light/dark selects) */}
        <KeyedSetting key="randomTheme" wide />
        {/* todo: theme picker (preset + custom tabs) */}
      </Section>
      <Section title="hide elements">
        <KeyedSetting key="showKeyTips" />
        <KeyedSetting key="showOutOfFocusWarning" />
        <KeyedSetting key="capsLockWarning" />
        <KeyedSetting key="showAverage" />
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

function KeyedSetting(props: {
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
