import { Config, ConfigSchema } from "@monkeytype/schemas/configs";
import { createSignal, For, JSXElement, Show } from "solid-js";

import { configMetadata } from "../../../config/metadata";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { hotkeys } from "../../../states/hotkeys";
import { cn } from "../../../utils/cn";
import { isFirefox } from "../../../utils/misc";
import { getOptions } from "../../../utils/zod";
import { Anime, AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { Kbd } from "../../common/Kbd";
import { CustomLayoutfluid } from "./custom-setting/CustomLayoutfluid";
import { CustomPolyglot } from "./custom-setting/CustomPolyglot";
import { Funbox } from "./custom-setting/Funbox";
import { Language } from "./custom-setting/Language";
import { MinAcc } from "./custom-setting/MinAcc";
import { MinBurst } from "./custom-setting/MinBurst";
import { MinSpeed } from "./custom-setting/MinSpeed";
import { QuickNav } from "./QuickNav";
import { Setting } from "./Setting";

export function Settings(): JSXElement {
  return (
    <div class="grid gap-8">
      <QuickNav />
      <Show when={getConfig.showKeyTips}>
        <div class="text-center text-sub">
          tip: You can also change all these settings quickly using the command
          line
          <br />(<Kbd hotkey={hotkeys.commandline} />
          <Show when={!isFirefox()}>
            &nbsp;or&nbsp;
            <Kbd hotkey="Mod+Shift+P" />
          </Show>
          )
        </div>
      </Show>
      <AccountSettingsNotice />
      <textarea class="h-100 resize-y bg-sub-alt">
        use me to align left and right size
      </textarea>
      <div>
        <Section title="behavior">
          {/* todo: tags */}
          {/* todo: presets */}
          <AutoSetting key="resultSaving" />
          <AutoSetting key="difficulty" />
          <AutoSetting key="quickRestart" />
          <AutoSetting key="repeatQuotes" />
          <AutoSetting key="blindMode" />
          <AutoSetting key="alwaysShowWordsHistory" />
          <AutoSetting key="singleListCommandLine" />
          <MinSpeed />
          <MinAcc />
          <MinBurst />
          <AutoSetting key="britishEnglish" />
          <Language />
          <Funbox />
          <CustomLayoutfluid />
          <CustomPolyglot />
        </Section>
        <Section title="input">
          <AutoSetting key="freedomMode" />
          <AutoSetting key="strictSpace" />
          <AutoSetting key="oppositeShiftMode" />
          <AutoSetting key="stopOnError" />
          <AutoSetting key="confidenceMode" />
          <AutoSetting key="quickEnd" />
          <AutoSetting key="indicateTypos" />
          <AutoSetting key="hideExtraLetters" />
          <AutoSetting key="compositionDisplay" />
          <AutoSetting key="lazyMode" />
          {/* todo: layout emulator */}
          <AutoSetting key="codeUnindentOnBackspace" />
        </Section>
        <Section title="sound">
          {/* todo: sound volume */}
          <AutoSetting key="playSoundOnClick" wide />
          <AutoSetting key="playSoundOnError" wide />
          <AutoSetting key="playTimeWarning" wide />
        </Section>
        <Section title="caret">
          <AutoSetting key="smoothCaret" />
          <AutoSetting key="caretStyle" wide />
          {/* pace caret */}
          <AutoSetting key="paceCaretStyle" wide />
          <AutoSetting key="repeatedPace" />
        </Section>
        <Section title="appearance">
          <AutoSetting key="timerStyle" wide />
          <AutoSetting key="liveSpeedStyle" />
          <AutoSetting key="liveAccStyle" />
          <AutoSetting key="liveBurstStyle" />
          <AutoSetting key="timerColor" />
          <AutoSetting key="timerOpacity" />
          <AutoSetting key="highlightMode" wide />
          <AutoSetting key="typedEffect" />
          <AutoSetting key="tapeMode" />
          {/* todo: tape margin */}
          <AutoSetting key="smoothLineScroll" />
          <AutoSetting key="showAllLines" />
          <AutoSetting key="alwaysShowDecimalPlaces" />
          <AutoSetting key="typingSpeedUnit" />
          <AutoSetting key="startGraphsAtZero" />
          {/* todo: max line width */}
          {/* todo: font size */}
          {/* todo: font family */}
          <AutoSetting key="keymapMode" />
          {/* todo: keymap layout */}
          <AutoSetting key="keymapStyle" wide />
          <AutoSetting key="keymapLegendStyle" wide />
          <AutoSetting key="keymapShowTopRow" wide />
          {/* todo: keymap size */}
        </Section>
        <Section title="theme">
          <AutoSetting key="flipTestColors" />
          <AutoSetting key="colorfulMode" />
          {/* todo: custom background (url + local image + size) */}
          {/* todo: custom background filter */}
          <AutoSetting key="autoSwitchTheme" />
          {/* todo: auto switch theme inputs (light/dark selects) */}
          <AutoSetting key="randomTheme" wide />
          {/* todo: theme picker (preset + custom tabs) */}
        </Section>
        <Section title="hide elements">
          <AutoSetting key="showKeyTips" />
          <AutoSetting key="showOutOfFocusWarning" />
          <AutoSetting key="capsLockWarning" />
          <AutoSetting key="showAverage" />
        </Section>
      </div>

      {/* todo: danger zone */}
      <AccountSettingsNotice />
    </div>
  );
}

function AccountSettingsNotice(): JSXElement {
  return (
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-8 rounded px-8 py-4 ring-4 ring-sub-alt">
      <Fa icon="fa-user-cog" class="text-4xl text-sub" />
      <div>
        Account settings have moved. You can now access them by hovering over
        the account button in the top right corner, then clicking &quot;Account
        settings&quot;.
      </div>
      <Button
        text="go to account settings"
        href="/account-settings"
        class="p-4"
        router-link
      />
    </div>
  );
}

function Section(props: { title: string; children: JSXElement }): JSXElement {
  const [isOpen, setIsOpen] = createSignal(true);

  return (
    <div id={`section_${props.title}`}>
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

function AutoSetting(props: {
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
