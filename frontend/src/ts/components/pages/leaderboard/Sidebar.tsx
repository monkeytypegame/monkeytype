import { Language } from "@monkeytype/schemas/languages";
import { Mode, Mode2 } from "@monkeytype/schemas/shared";
import {
  Accessor,
  createEffect,
  createSignal,
  For,
  JSXElement,
  Show,
} from "solid-js";

import { getServerConfiguration } from "../../../ape/server-configuration";
import { FaSolidIcon } from "../../../types/font-awesome";
import { Button } from "../../common/Button";

type GroupItem<T> = { id: T; text: string; icon: FaSolidIcon };
export type LeaderboardType = "allTime" | "daily" | "weekly";
export type Selection = {
  type: LeaderboardType;
  friendsOnly: boolean;
  mode?: Mode;
  // oxlint-disable-next-line typescript/no-explicit-any
  mode2?: Mode2<any>;
  language?: Language;
};

type LanguagesByModeByMode2 = Partial<
  // oxlint-disable-next-line typescript/no-explicit-any
  Record<Mode, Record<Mode2<any>, Language[]>>
>;

type ValidLeaderboards = {
  allTime: LanguagesByModeByMode2;
  weekly: LanguagesByModeByMode2;
  daily: LanguagesByModeByMode2;
};

type ModeSelect = Required<Pick<Selection, "mode" | "mode2">>;

export function Sidebar(props: {
  onSelect: (selection: Selection) => void;
}): JSXElement {
  const [type, setType] = createSignal<Selection["type"]>("allTime");
  const [friendsOnly, setFriendsOnly] =
    createSignal<Selection["friendsOnly"]>(false);
  const [mode, setMode] = createSignal<ModeSelect | undefined>({
    mode: "time",
    mode2: "15",
  });
  const [language, setLanguage] =
    createSignal<Selection["language"]>("english");

  const validLeaderboards = (): ValidLeaderboards => getValidLeaderboards();

  /**
   * update leaderboard selection to a valid state.
   * @param key
   * @returns
   */
  const setSelected = (
    key: "type" | "mode" | "language",
  ): ((val: unknown) => void) => {
    return (value) => {
      const state = {
        type: type(),
        mode: mode(),
        language: language(),
      };

      //@ts-expect-error generic
      state[key] = value;

      if (state.type === "weekly") {
        setType("weekly");
        setLanguage(undefined);
        setMode(undefined);
        return;
      }
      state.mode ??= { mode: "time", mode2: "15" };

      const validLeaderboard = validLeaderboards()[state.type];

      let validModes2 = validLeaderboard[state.mode.mode];

      if (validModes2 === undefined) {
        const firstMode = Object.keys(validLeaderboard).sort()[0] as Mode;
        if (firstMode === undefined) {
          throw new Error(`no valid leaderboard config for type ${state.type}`);
        }
        state.mode.mode = firstMode;
        validModes2 = validLeaderboard[firstMode];
      }

      let supportedLanguages = validModes2?.[state.mode.mode2];
      if (supportedLanguages === undefined) {
        const firstLanguage = Object.keys(validModes2 ?? {}).sort(
          (a, b) => parseInt(a) - parseInt(b),
        )[0];
        if (firstLanguage === undefined) {
          throw new Error(
            `no valid leaderboard config for type ${state.type} and mode ${state.mode.mode}`,
          );
        }
        state.mode.mode2 = firstLanguage;
        supportedLanguages = validModes2?.[firstLanguage];
      }

      if (supportedLanguages === undefined || supportedLanguages.length < 1) {
        throw new Error(
          `Daily leaderboard config not valid for mode:${state.mode.mode} mode2:${state.mode.mode2 as string}`,
        );
      }

      if (
        state.language === undefined ||
        !supportedLanguages.includes(state.language)
      ) {
        state.language = supportedLanguages.sort()[0] as Language;
      }

      setType(state.type);
      setMode(state.mode);
      setLanguage(state.language);
    };
  };

  createEffect(() => {
    props.onSelect({
      type: type(),
      friendsOnly: friendsOnly(),
      mode: mode()?.mode,
      mode2: mode()?.mode2,
      language: language(),
    });
  });

  return (
    <>
      <Group
        selected={type}
        onSelect={setSelected("type")}
        items={[
          {
            id: "allTime",
            text: "all-time english",
            icon: "fa-globe-americas",
          },
          {
            id: "weekly",
            text: "weekly xp",
            icon: "fa-calendar-day",
          },
          {
            id: "daily",
            text: "daily",
            icon: "fa-sun",
          },
        ]}
      />
      <Group
        selected={friendsOnly}
        onSelect={setFriendsOnly}
        items={[
          {
            id: false,
            text: "everyone",
            icon: "fa-users",
          },
          {
            id: true,
            text: "friends only",
            icon: "fa-user-friends",
          },
        ]}
      />
      <Show when={type() !== "weekly"}>
        <Group
          selected={mode}
          onSelect={setSelected("mode")}
          items={getModeButtons(validLeaderboards()[type()], language())}
        />
      </Show>
      <Show when={type() === "daily"}>
        <Group
          selected={language}
          onSelect={setSelected("language")}
          items={getLanguageButtons(validLeaderboards()[type()], mode())}
        />
      </Show>
    </>
  );
}

function Group<T>(props: {
  items: GroupItem<T>[];
  selected: Accessor<T>;
  onSelect: (selected: T) => void;
}): JSXElement {
  const isEqual = (a: unknown, b: unknown): boolean =>
    typeof a === "object" ? JSON.stringify(a) === JSON.stringify(b) : a === b;

  return (
    <div class="bg-sub-alt mb-4 grid gap-4 rounded-xl p-4">
      <For each={props.items}>
        {(item) => (
          <Button
            onClick={() => props.onSelect(item.id)}
            fa={{ icon: item.icon }}
            text={item.text}
            class="justify-start"
            active={isEqual(item.id, props.selected())}
          />
        )}
      </For>
    </div>
  );
}

function getModeButtons(
  valid: LanguagesByModeByMode2,
  language?: Language,
): GroupItem<ModeSelect>[] {
  const modes = Object.entries(valid).flatMap(([mode, mode2List]) =>
    Object.entries(mode2List)
      .filter(
        ([_, languages]) =>
          language === undefined || languages.includes(language),
      )
      .flatMap(([mode2]) => ({
        id: { mode, mode2 },
        text: `${mode} ${mode2}`,
        icon: mode === "time" ? "fa-clock" : "fa-align-left",
      })),
  );

  return modes as GroupItem<ModeSelect>[];
}

function getLanguageButtons(
  valid: LanguagesByModeByMode2,
  mode: ModeSelect | undefined,
): GroupItem<Language>[] {
  console.log("#### getLanguageButtons", mode);
  if (mode === undefined) return [];

  return (valid[mode.mode]?.[mode.mode2] ?? []).map((language) => ({
    id: language,
    text: language,
    icon: "fa-globe",
  }));
}
function getValidLeaderboards(): ValidLeaderboards {
  const dailyRulesConfig =
    getServerConfiguration()?.dailyLeaderboards.validModeRules ?? [];

  //a rule can contain multiple values. create a flat list out of them
  const dailyRules = dailyRulesConfig.flatMap((rule) => {
    const languages = convertRuleOption(rule.language) as Language[];
    const mode2List = convertRuleOption(rule.mode2);

    return mode2List.map((mode2) => ({
      mode: rule.mode as Mode,
      mode2,
      languages,
    }));
  });

  return {
    allTime: {
      time: {
        "15": ["english"],
        "60": ["english"],
      },
    },
    weekly: {},
    daily: dailyRules.reduce<
      Partial<Record<Mode, Record<string /*mode2*/, Language[]>>>
    >((acc, { mode, mode2, languages }) => {
      let modes = acc[mode];
      if (modes === undefined) {
        modes = {};
        acc[mode] = modes;
      }

      let modes2 = modes[mode2];
      if (modes2 === undefined) {
        modes2 = [];
        modes[mode2] = modes2;
      }

      modes2.push(...languages);
      return acc;
    }, {}),
  };
}

function convertRuleOption(rule: string): string[] {
  if (rule.startsWith("(")) {
    return rule.slice(1, -1).split("|");
  }
  return [rule];
}
