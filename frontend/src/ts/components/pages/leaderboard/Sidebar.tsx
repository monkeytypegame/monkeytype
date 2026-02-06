import { Language } from "@monkeytype/schemas/languages";
import { Mode } from "@monkeytype/schemas/shared";
import { For, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { getServerConfiguration } from "../../../ape/server-configuration";
import { Selection } from "../../../queries/leaderboards";
import { isLoggedIn } from "../../../signals/core";
import { FaSolidIcon } from "../../../types/font-awesome";
import { Button } from "../../common/Button";

type GroupItem<T> = { id: T; text: string; icon: FaSolidIcon };

type LanguagesByModeByMode2 = Partial<Record<Mode, Record<string, Language[]>>>;

type ValidLeaderboards = {
  allTime: LanguagesByModeByMode2;
  weekly: LanguagesByModeByMode2;
  daily: LanguagesByModeByMode2;
};

export type ModeSelect = Pick<Selection, "mode" | "mode2">;

export function Sidebar(props: {
  onSelect: (selection: Selection) => void;
}): JSXElement {
  const [selection, setSelection] = createStore<Selection>({
    type: "allTime",
    mode: "time",
    mode2: "15",
    language: "english",
    previous: false,
    friendsOnly: false,
  });

  const validLeaderboards = (): ValidLeaderboards => getValidLeaderboards();

  function updateSelection(patch: Partial<Selection>): void {
    setSelection((prev) => {
      const newValue = normalizeSelection(
        //@ts-expect-error this is fine
        { ...prev, ...patch },
        validLeaderboards(),
      );
      props.onSelect(newValue);
      return newValue;
    });
  }

  function selectType(type: Selection["type"]): void {
    updateSelection({ type });
  }

  function selectMode(value: ModeSelect): void {
    updateSelection({ mode: value.mode, mode2: value.mode2 });
  }

  function selectLanguage(language: Language): void {
    updateSelection({ language });
  }
  function selectFriendsOnly(friendsOnly: boolean): void {
    updateSelection({ friendsOnly });
  }

  return (
    <>
      <Group
        selected={selection.type}
        onSelect={selectType}
        items={[
          {
            id: "allTime",
            text: "all-time english",
            icon: "fa-globe-americas",
          },
          { id: "weekly", text: "weekly xp", icon: "fa-calendar-day" },
          { id: "daily", text: "daily", icon: "fa-sun" },
        ]}
      />
      <Show when={isLoggedIn()}>
        <Group
          selected={selection.friendsOnly}
          onSelect={selectFriendsOnly}
          items={[
            { id: false, text: "everyone", icon: "fa-users" },
            { id: true, text: "friends only", icon: "fa-user-friends" },
          ]}
        />
      </Show>
      <Show when={selection.type !== "weekly"}>
        <Group
          selected={{ mode: selection.mode, mode2: selection.mode2 }}
          onSelect={selectMode}
          items={getModeButtons(
            validLeaderboards()[selection.type],
            selection.language as Language,
          )}
        />
      </Show>
      <Show when={selection.type === "daily"}>
        <Group
          selected={selection.language as Language}
          onSelect={selectLanguage}
          items={getLanguageButtons(
            validLeaderboards().daily,
            selection.mode as Mode,
            selection.mode2 as string,
          )}
        />
      </Show>
    </>
  );
}

function Group<T>(props: {
  items: GroupItem<T>[];
  selected: T;
  onSelect: (selected: T) => void;
}): JSXElement {
  const isEqual = (a: unknown, b: unknown): boolean =>
    typeof a === "object" ? JSON.stringify(a) === JSON.stringify(b) : a === b;

  return (
    <div class="mb-4 grid gap-4 rounded-xl bg-sub-alt p-4">
      <For each={props.items}>
        {(item) => (
          <Button
            onClick={() => props.onSelect(item.id)}
            fa={{ icon: item.icon }}
            text={item.text}
            class="justify-start"
            active={isEqual(item.id, props.selected)}
          />
        )}
      </For>
    </div>
  );
}

function normalizeSelection(
  draft: Selection,
  valid: ValidLeaderboards,
): Selection {
  if (draft.type === "weekly") {
    return {
      ...draft,
      mode: undefined,
      mode2: undefined,
      language: undefined,
      previous: false,
    };
  }

  let { mode, mode2, language } = draft;
  const validModes = valid[draft.type];

  if (mode === null || validModes[mode] === undefined) {
    const firstMode = Object.keys(validModes).sort()[0] as Mode | undefined;
    if (!firstMode) {
      throw new Error(`No valid mode for type ${draft.type}`);
    }
    mode = firstMode;
  }

  const validMode2 = validModes[mode] as Record<string, Language[]>;

  if (mode2 === null || validMode2[mode2] === undefined) {
    const firstMode2 = Object.keys(validMode2).sort(
      (a, b) => parseInt(a) - parseInt(b),
    )[0];
    if (firstMode2 === undefined) {
      throw new Error(`No valid mode2 for ${draft.type}:${mode}`);
    }
    mode2 = firstMode2;
  }

  const supportedLanguages = validMode2[mode2];
  if (!supportedLanguages || supportedLanguages.length === 0) {
    throw new Error(`Invalid leaderboard config for ${mode}:${mode2}`);
  }

  if (!language || !supportedLanguages.includes(language)) {
    language = supportedLanguages.sort()[0] as Language;
  }

  return { ...draft, mode, mode2, language };
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
  mode: Mode,
  mode2: string,
): GroupItem<Language>[] {
  if (mode === undefined) return [];

  return (valid[mode]?.[mode2] ?? []).map((language) => ({
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
  return rule.startsWith("(") ? rule.slice(1, -1).split("|") : [rule];
}
