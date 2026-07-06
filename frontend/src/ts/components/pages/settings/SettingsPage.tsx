import { createResource, createSignal, JSXElement, Show } from "solid-js";
import { z } from "zod";

import { resetConfig } from "../../../config/lifecycle";
import { getConfig } from "../../../config/store";
import {
  playTimeWarning,
  previewClick,
  previewError,
} from "../../../controllers/sound-controller";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { isAuthenticated } from "../../../states/core";
import { showModal } from "../../../states/modals";
import { isSettingsSearchActive } from "../../../states/settings-search";
import { showSimpleModal } from "../../../states/simple-modal";
import { cn } from "../../../utils/cn";
import fileStorage from "../../../utils/file-storage";
import { wordsToCamelCase } from "../../../utils/strings";
import { Anime, AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { Page } from "../../common/Page";
import { CommandlineHotkey } from "../../hotkeys/CommandlineHotkey";
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
import { SearchableAutoSetting } from "./SearchableAutoSetting";
import { SearchableSetting } from "./SearchableSetting";
import { SettingsSearch } from "./SettingsSearch";

export function SettingsPage(): JSXElement {
  const [hasLocalBg] = createResource(
    () => fileStorage.track("LocalBackgroundFile"),
    async () => fileStorage.hasFile("LocalBackgroundFile"),
  );

  return (
    <Page id="settings">
      <div class="grid gap-8">
        {/* while filtering, only the matching settings stay visible; everything
            else is hidden with css so nothing unmounts while typing */}
        <QuickNav class={cn(isSettingsSearchActive() && "hidden")} />
        <Show when={getConfig.showKeyTips}>
          <div
            class={cn(
              "text-center text-sub",
              isSettingsSearchActive() && "hidden",
            )}
          >
            tip: You can also change all these settings quickly using the
            command line
            <br />( <CommandlineHotkey /> )
          </div>
        </Show>
        <AccountSettingsNotice />
        <SettingsSearch />
        {/* while filtering, lay the matching sections out with a uniform gap */}
        <div class={cn(isSettingsSearchActive() && "grid gap-8")}>
          <Section title="behavior">
            <Show when={isAuthenticated()}>
              <Tags />
              <Presets />
              <SearchableAutoSetting key="resultSaving" />
            </Show>
            <SearchableAutoSetting key="difficulty" />
            <SearchableAutoSetting key="quickRestart" />
            <SearchableAutoSetting key="repeatQuotes" />
            <SearchableAutoSetting key="blindMode" />
            <SearchableAutoSetting key="alwaysShowWordsHistory" />
            <SearchableAutoSetting key="singleListCommandLine" />
            <MinSpeed />
            <MinAcc />
            <MinBurst />
            <SearchableAutoSetting key="britishEnglish" />
            <Language />
            <Funbox />
            <CustomLayoutfluid />
            <CustomPolyglot />
            <SearchableSetting
              key="fingerTraining"
              title="finger training"
              description="Practice with words that disproportionately exercise the fingers you pick. Your usual test settings come back when you stop training."
              extraSearchKeywords="touch typing practice drill pinky"
              fa={{
                icon: "fa-hand-paper",
              }}
              inputs={
                <Button
                  class="w-full"
                  onClick={() => {
                    showModal("FingerTraining");
                  }}
                >
                  open
                </Button>
              }
            />
          </Section>
          <Section title="input">
            <SearchableAutoSetting key="freedomMode" />
            <SearchableAutoSetting key="strictSpace" />
            <SearchableAutoSetting key="oppositeShiftMode" />
            <SearchableAutoSetting key="stopOnError" />
            <SearchableAutoSetting key="confidenceMode" />
            <SearchableAutoSetting key="quickEnd" />
            <SearchableAutoSetting key="indicateTypos" />
            <SearchableAutoSetting key="hideExtraLetters" />
            <SearchableAutoSetting key="compositionDisplay" />
            <SearchableAutoSetting key="lazyMode" />
            <Layout />
            <SearchableAutoSetting key="codeUnindentOnBackspace" />
          </Section>
          <Section title="sound">
            <SoundVolume />
            <SearchableAutoSetting
              key="playSoundOnClick"
              wide
              onOptionClick={(option) => {
                if (option === "off") return;
                void previewClick(option);
              }}
            />
            <SearchableAutoSetting
              key="playSoundOnError"
              wide
              onOptionClick={(option) => {
                if (option === "off") return;
                void previewError(option);
              }}
            />
            <SearchableAutoSetting
              key="playTimeWarning"
              wide
              onOptionClick={(option) => {
                if (option === "off") return;
                void playTimeWarning();
              }}
            />
          </Section>
          <Section title="caret">
            <SearchableAutoSetting key="smoothCaret" />
            <SearchableAutoSetting key="caretStyle" wide />
            <PaceCaret />
            <SearchableAutoSetting key="repeatedPace" />
            <SearchableAutoSetting key="paceCaretStyle" wide />
          </Section>
          <Section title="appearance">
            <SearchableAutoSetting key="timerStyle" wide />
            <SearchableAutoSetting key="liveSpeedStyle" />
            <SearchableAutoSetting key="liveAccStyle" />
            <SearchableAutoSetting key="liveBurstStyle" />
            <SearchableAutoSetting key="timerColor" />
            <SearchableAutoSetting key="timerOpacity" />
            <SearchableAutoSetting key="highlightMode" wide />
            <SearchableAutoSetting key="typedEffect" />
            <SearchableAutoSetting key="tapeMode" />
            <SearchableAutoSetting key="tapeMargin" />
            <SearchableAutoSetting key="smoothLineScroll" />
            <SearchableAutoSetting key="showAllLines" />
            <SearchableAutoSetting key="alwaysShowDecimalPlaces" />
            <SearchableAutoSetting key="typingSpeedUnit" />
            <SearchableAutoSetting key="startGraphsAtZero" />
            <MaxLineWidth />
            <SearchableAutoSetting key="fontSize" />
            <FontFamily />
            <SearchableAutoSetting key="keymapMode" />
            <Show when={getConfig.keymapMode !== "off"}>
              <KeymapLayout />
              <SearchableAutoSetting key="keymapStyle" wide />
              <SearchableAutoSetting key="keymapLegendStyle" wide />
              <SearchableAutoSetting key="keymapShowTopRow" wide />
              <KeymapSize />
            </Show>
          </Section>
          <Section title="theme">
            <SearchableAutoSetting key="flipTestColors" />
            <SearchableAutoSetting key="colorfulMode" />
            <CustomBackground />
            <Show when={getConfig.customBackground !== "" || hasLocalBg()}>
              <CustomBackgroundFilters />
            </Show>
            <AutoSwitchTheme />
            <SearchableAutoSetting key="randomTheme" wide />
            <Theme />
          </Section>
          <Section title="hide elements">
            <SearchableAutoSetting key="showKeyTips" />
            <SearchableAutoSetting key="showOutOfFocusWarning" />
            <SearchableAutoSetting key="capsLockWarning" />
            <SearchableAutoSetting key="showAverage" />
          </Section>
          <Section title="danger zone">
            <ImportExport />
            <SearchableAutoSetting key="ads" />
            <SearchableSetting
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
            <SearchableSetting
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
      <div
        class={cn(
          "grid grid-cols-[auto_1fr] items-center gap-4 rounded px-4 py-4 ring-4 ring-sub-alt md:grid-cols-[auto_1fr_auto] md:gap-8",
          isSettingsSearchActive() && "hidden",
        )}
      >
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
    <div
      id={`group_${wordsToCamelCase(props.title)}`}
      class={cn(
        // when filtering, drop sections where every setting is hidden
        isSettingsSearchActive() &&
          "not-has-[[data-setting-key]:not(.hidden)]:hidden",
      )}
    >
      <Button
        variant="text"
        class={cn(
          "mb-8 w-max gap-4 p-0 text-4xl",
          isSettingsSearchActive() && "hidden",
        )}
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
      <AnimeShow
        when={isOpen() || isSettingsSearchActive()}
        slide
        class="grid gap-8"
      >
        {props.children}
        <div class={cn("h-16", isSettingsSearchActive() && "hidden")}></div>
      </AnimeShow>
    </div>
  );
}
