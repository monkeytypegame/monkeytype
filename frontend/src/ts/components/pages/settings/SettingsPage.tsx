import { Config, ConfigSchema } from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { createResource, createSignal, For, JSXElement, Show } from "solid-js";
import { z } from "zod";

import { resetConfig } from "../../../config/lifecycle";
import { configMetadata, OptionMetadata } from "../../../config/metadata";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import {
  playTimeWarning,
  previewClick,
  previewError,
} from "../../../controllers/sound-controller";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useSavedIndicator } from "../../../hooks/useSavedIndicator";
import { isAuthenticated } from "../../../states/core";
import { showModal } from "../../../states/modals";
import { showSimpleModal } from "../../../states/simple-modal";
import { cn } from "../../../utils/cn";
import fileStorage from "../../../utils/file-storage";
import { wordsToCamelCase } from "../../../utils/strings";
import { getOptions } from "../../../utils/zod";
import { Anime, AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { Page } from "../../common/Page";
import { CommandlineHotkey } from "../../hotkeys/CommandlineHotkey";
import { InputField } from "../../ui/form/InputField";
import { fromSchema } from "../../ui/form/utils";
import { AnimationFpsLimit } from "./custom-setting/AnimationFpsLimit";
import { AutoSwitchTheme } from "./custom-setting/AutoSwitchTheme";
import { CustomBackground } from "./custom-setting/CustomBackground";
import { CustomBackgroundFilters } from "./custom-setting/CustomBackgroundFilters";
import { CustomLayoutfluid } from "./custom-setting/CustomLayoutfluid";
import { CustomPolyglot } from "./custom-setting/CustomPolyglot";
import { FontFamily } from "./custom-setting/FontFamily";
import { Funbox } from "./custom-setting/Funbox";
import { ImportExport } from "./custom-setting/ImportExport";
import { KeymapLayout } from "./custom-setting/KeymapLayout";
import { KeymapSize } from "./custom-setting/KeymapSize";
import { Language } from "./custom-setting/Language";
import { Layout } from "./custom-setting/Layout";
import { MaxLineWidth } from "./custom-setting/MaxLineWidth";
import { MinAcc } from "./custom-setting/MinAcc";
import { MinBurst } from "./custom-setting/MinBurst";
import { MinSpeed } from "./custom-setting/MinSpeed";
import { PaceCaret } from "./custom-setting/PaceCaret";
import { Presets } from "./custom-setting/Presets";
import { SoundVolume } from "./custom-setting/SoundVolume";
import { Tags } from "./custom-setting/Tags";
import { Theme } from "./custom-setting/Theme";
import { QuickNav } from "./QuickNav";
import { Setting } from "./Setting";

export function SettingsPage(): JSXElement {
  const [hasLocalBg] = createResource(
    () => fileStorage.track("LocalBackgroundFile"),
    async () => fileStorage.hasFile("LocalBackgroundFile"),
  );

  return (
    <Page id="settings">
      <div class="grid gap-8">
        <QuickNav />
        <Show when={getConfig.showKeyTips}>
          <div class="text-center text-sub">
            tip: You can also change all these settings quickly using the
            command line
            <br />( <CommandlineHotkey /> )
          </div>
        </Show>
        <AccountSettingsNotice />
        <div>
          <Section title="behavior">
            <Show when={isAuthenticated()}>
              <Tags />
              <Presets />
              <AutoSetting key="resultSaving" />
            </Show>
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
            <Layout />
            <AutoSetting key="codeUnindentOnBackspace" />
          </Section>
          <Section title="sound">
            <SoundVolume />
            <AutoSetting
              key="playSoundOnClick"
              wide
              onOptionClick={(option) => {
                if (option === "off") return;
                void previewClick(option);
              }}
            />
            <AutoSetting
              key="playSoundOnError"
              wide
              onOptionClick={(option) => {
                if (option === "off") return;
                void previewError(option);
              }}
            />
            <AutoSetting
              key="playTimeWarning"
              wide
              onOptionClick={(option) => {
                if (option === "off") return;
                void playTimeWarning();
              }}
            />
          </Section>
          <Section title="caret">
            <AutoSetting key="smoothCaret" />
            <AutoSetting key="caretStyle" wide />
            <PaceCaret />
            <AutoSetting key="repeatedPace" />
            <AutoSetting key="paceCaretStyle" wide />
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
            <AutoSetting key="tapeMargin" />
            <AutoSetting key="smoothLineScroll" />
            <AutoSetting key="showAllLines" />
            <AutoSetting key="alwaysShowDecimalPlaces" />
            <AutoSetting key="typingSpeedUnit" />
            <AutoSetting key="startGraphsAtZero" />
            <MaxLineWidth />
            <AutoSetting key="fontSize" />
            <FontFamily />
            <AutoSetting key="keymapMode" />
            <Show when={getConfig.keymapMode !== "off"}>
              <KeymapLayout />
              <AutoSetting key="keymapStyle" wide />
              <AutoSetting key="keymapLegendStyle" wide />
              <AutoSetting key="keymapShowTopRow" wide />
              <KeymapSize />
            </Show>
          </Section>
          <Section title="theme">
            <AutoSetting key="flipTestColors" />
            <AutoSetting key="colorfulMode" />
            <CustomBackground />
            <Show when={getConfig.customBackground !== "" || hasLocalBg()}>
              <CustomBackgroundFilters />
            </Show>
            <AutoSwitchTheme />
            <AutoSetting key="randomTheme" wide />
            <Theme />
          </Section>
          <Section title="hide elements">
            <AutoSetting key="showKeyTips" />
            <AutoSetting key="showOutOfFocusWarning" />
            <AutoSetting key="capsLockWarning" />
            <AutoSetting key="showAverage" />
          </Section>
          <Section title="danger zone">
            <ImportExport />
            <AutoSetting key="ads" />
            <Setting
              key="cookies"
              title="update cookie preferences"
              description="If you changed your mind about which cookies you consent to, you can change your preferences here."
              fa={{
                icon: "fa-cookie-bite",
              }}
              inputs={
                <Button
                  class="w-full"
                  onClick={() => {
                    showModal("Cookies");
                  }}
                >
                  open
                </Button>
              }
            />
            <AnimationFpsLimit />
            <Setting
              key="resetSettings"
              title="reset settings"
              description={
                <div>
                  Resets settings to the default (but doesn&apos;t touch your
                  tags and presets).
                  <br />
                  <div class="text-error">You can&apos;t undo this!</div>
                </div>
              }
              fa={{
                icon: "fa-undo",
              }}
              inputs={
                <Button
                  class="w-full"
                  danger
                  onClick={() => {
                    showSimpleModal({
                      title: "Are you sure?",
                      buttonText: "reset",
                      execFn: async () => {
                        await resetConfig();
                        await fileStorage.deleteFile("LocalBackgroundFile");
                        return {
                          status: "success",
                          message: "Settings reset",
                        };
                      },
                    });
                  }}
                >
                  reset settings
                </Button>
              }
            />
          </Section>
        </div>

        <AccountSettingsNotice />
      </div>
    </Page>
  );
}

function AccountSettingsNotice(): JSXElement {
  const [dismissed, setDismissed] = useLocalStorage({
    key: "accountSettingsMessageDismissed",
    schema: z.boolean(),
    fallback: false,
  });
  return (
    <Show when={!dismissed()}>
      <div class="grid grid-cols-[auto_1fr] items-center gap-4 rounded px-4 py-4 ring-4 ring-sub-alt md:grid-cols-[auto_1fr_auto] md:gap-8">
        <Fa icon="fa-user-cog" class="text-4xl text-sub" />
        <div>
          Account settings have moved. You can now access them by hovering over
          the account button in the top right corner, then clicking
          &quot;Account settings&quot;.
        </div>
        <Button
          text="go to account settings"
          href="/account-settings"
          class="col-span-2 p-4 md:col-span-1"
          router-link
          onClick={() => {
            setDismissed(true);
          }}
        />
      </div>
    </Show>
  );
}

function Section(props: { title: string; children: JSXElement }): JSXElement {
  const [isOpen, setIsOpen] = createSignal(true);

  return (
    <div id={`group_${wordsToCamelCase(props.title)}`}>
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

function AutoSetting<T extends keyof Config>(props: {
  key: T;
  inputs?: JSXElement;
  wide?: boolean;
  onOptionClick?: (value: Config[T]) => void;
}): JSXElement {
  const savedIndicator = useSavedIndicator();

  const form = createForm(() => ({
    defaultValues: {
      [props.key]: getConfig[props.key],
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value[props.key]));
      if (val === getConfig[props.key]) return;
      savedIndicator.flash();
      setConfig(props.key, val as Config[T]);
    },
  }));

  const autoInputs = () => {
    if (
      ConfigSchema.shape[props.key]._def.typeName ===
      z.ZodFirstPartyTypeKind.ZodNumber
    ) {
      return (
        <div class="grid w-full gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              //@ts-expect-error what
              name={props.key}
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "Must be a number";
                  }
                  return fromSchema(
                    ConfigSchema.shape[props.key] as z.ZodNumber,
                  )({
                    value: val,
                  });
                },
                onBlur: () => {
                  void form.handleSubmit();
                },
              }}
              children={(field) => (
                <div class="relative">
                  <InputField
                    field={field}
                    placeholder={
                      configMetadata[props.key].displayString ?? props.key
                    }
                    type="number"
                    resetToDefaultIfEmptyOnBlur
                  />
                  <savedIndicator.component />
                </div>
              )}
            />
          </form>
        </div>
      );
    }

    const options = getOptions(ConfigSchema.shape[props.key])?.filter((opt) => {
      const optionsMeta = (
        configMetadata[props.key] as {
          optionsMetadata?: Record<string, OptionMetadata> | undefined;
        }
      ).optionsMetadata;

      const optionMeta = optionsMeta?.[String(opt)];

      return optionMeta?.visible !== false;
    });

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

                return (option as string).toString().replace(/_/g, " ");
              };
              return (
                <Button
                  active={getConfig[props.key] === option}
                  onClick={() => {
                    if (getConfig[props.key] === option) return;
                    props.onOptionClick?.(option as Config[T]);
                    setConfig(props.key, option as Config[T]);
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
      key={props.key}
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
