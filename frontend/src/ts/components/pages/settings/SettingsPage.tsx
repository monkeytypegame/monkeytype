import {
  createResource,
  createSignal,
  JSXElement,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
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
import { getActivePage } from "../../../states/router";
import { isSettingsSearchActive } from "../../../states/settings-search";
import { showSimpleModal } from "../../../states/simple-modal";
import { cn } from "../../../utils/cn";
import fileStorage from "../../../utils/file-storage";
import { wordsToCamelCase } from "../../../utils/strings";
import { Anime, AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { CommandlineHotkey } from "../../hotkeys/CommandlineHotkey";
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
  onMount(() => highlightSettingFromUrl());

  const [hasLocalBg] = createResource(
    () => fileStorage.track("LocalBackgroundFile"),
    async () => fileStorage.hasFile("LocalBackgroundFile"),
  );

  return (
    <div class="grid gap-8">
      <Show when={getActivePage() === "settings"}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc faucibus
        in nibh in iaculis. Suspendisse semper venenatis dignissim. Aliquam
        consequat non lorem in blandit. Sed finibus magna quis tellus
        consectetur tristique. Suspendisse molestie cursus malesuada. Nunc augue
        lorem, placerat non bibendum id, ullamcorper vitae leo. Phasellus
        feugiat mauris quam. Nam blandit leo leo, ut maximus purus dapibus a.
        Cras egestas sit amet velit a imperdiet. Curabitur sed metus pretium,
        maximus dolor vel, facilisis neque. Suspendisse potenti. Aliquam in nunc
        purus. Pellentesque eleifend elit non ex dignissim condimentum. Mauris
        non malesuada ligula. Integer mollis eu erat id semper. In quis nibh vel
        mi rutrum interdum id quis velit. Nunc vel commodo elit. Nullam at
        lectus ipsum. Sed vel turpis nulla. Aenean at dui quis lorem consequat
        vehicula vehicula non eros. Nam aliquet posuere felis ac pretium.
        Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere
        cubilia curae; Integer maximus, metus pharetra facilisis ultricies, est
        libero sodales lorem, a commodo nisl lacus vel metus. In sit amet rutrum
        orci, ut euismod magna. Vestibulum et laoreet nisl. Vivamus non ante sed
        mi congue tincidunt vel eu ligula. Ut imperdiet ligula in nunc hendrerit
        fermentum. Etiam est est, egestas nec porttitor nec, hendrerit nec mi.
        In ultricies enim et feugiat volutpat. Praesent aliquam justo ut urna
        dictum maximus. Vestibulum ac dictum lectus, nec cursus tortor. Aenean
        dui leo, bibendum non nunc nec, faucibus tempor orci. Nam vestibulum
        aliquet mauris, id condimentum risus hendrerit vel. Aenean viverra
        pulvinar libero in sodales. Vivamus tincidunt odio eget tellus semper
        dapibus. Morbi ac pretium massa. Nullam efficitur enim quis arcu egestas
        maximus. Suspendisse id euismod dolor. Quisque orci enim, molestie at
        lectus ac, tincidunt consequat elit. Cras at condimentum leo. Etiam
        convallis eros ut porta sodales. Nullam purus massa, hendrerit ut arcu
        a, feugiat gravida nisi. Suspendisse eget ornare mauris. Phasellus
        interdum lacus nec metus cursus luctus non quis neque. Phasellus
        pharetra posuere sem non ultrices. Vestibulum et interdum est, a tempus
        quam. Curabitur tempor varius sem ac accumsan. Nulla quis sem et magna
        dictum interdum. Nam feugiat, massa non iaculis varius, metus neque
        ornare dolor, sed pellentesque nisl libero id purus. Class aptent taciti
        sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
        Integer maximus nunc nec hendrerit pellentesque. Aenean consequat
        ultrices ultricies. Suspendisse sagittis sem lacinia libero semper
        semper.{" "}
      </Show>

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
          tip: You can also change all these settings quickly using the command
          line
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
        </Section>
        <Section title="input">
          <SearchableAutoSetting key="freedomMode" />
          <SearchableAutoSetting key="strictSpace" />
          <SearchableAutoSetting key="oppositeShiftMode" />
          <SearchableAutoSetting key="stopOnError" />
          <SearchableAutoSetting key="deleteOnError" />
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
            <SearchableAutoSetting key="keymapKeys" wide />
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
          <SearchableAutoSetting key="ads" />
        </Section>
        <Section title="danger zone">
          <ImportExport />
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
          <SearchableSetting
            key="theRest"
            title="the rest"
            description="Niche settings that only affect minor functionality. Most people will never need to touch these."
            fa={{
              icon: "fa-sliders-h",
            }}
            extraSearchKeywords="animation fps limit sarcastic result message"
            inputs={
              <Button
                class="w-full"
                onClick={() => {
                  showModal("TheRest");
                }}
              >
                open
              </Button>
            }
          />
          <SearchableSetting
            key="resetSettings"
            title="reset settings"
            description={
              <div>
                Resets settings to the default (but doesn&apos;t touch your tags
                and presets).
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

/**
 * Scrolls to and highlights the setting from the `?highlight=` param (deep links).
 */
function highlightSettingFromUrl(): void {
  const highlight = new URLSearchParams(window.location.search).get(
    "highlight",
  );
  if (highlight === null) return;

  const element = document.querySelector<HTMLElement>(
    `#pageSettings [data-setting-key="${CSS.escape(highlight)}"]`,
  );
  if (element === null) return;

  // wait for the page fade in
  const timeout = setTimeout(() => {
    element.scrollIntoView({ block: "center", behavior: "auto" });
    element.classList.add("settings-highlight");
  }, 250);
  onCleanup(() => clearTimeout(timeout));
}
