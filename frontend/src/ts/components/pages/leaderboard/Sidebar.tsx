import { Language } from "@monkeytype/schemas/languages";
import {
  Accessor,
  createEffect,
  createSignal,
  For,
  JSXElement,
  Show,
} from "solid-js";

import { FaSolidIcon } from "../../../types/font-awesome";
import { Button } from "../../common/Button";
export type Selection = {
  type: "allTime" | "daily" | "weekly";
  friendsOnly: boolean;
  time?: "15" | "60";
  language?: Language;
};

export function Sidebar(props: {
  onSelect: (selection: Selection) => void;
}): JSXElement {
  const [type, setType] = createSignal<Selection["type"]>("allTime");
  const [friendsOnly, setFriendsOnly] =
    createSignal<Selection["friendsOnly"]>(false);
  const [time, setTime] = createSignal<Selection["time"]>("15");
  const [language, setLanguage] =
    createSignal<Selection["language"]>("english");

  createEffect(() => {
    props.onSelect({
      type: type(),
      friendsOnly: friendsOnly(),
      time: type() !== "weekly" ? time() : undefined,
      language: type() === "daily" ? language() : undefined,
    });
  });

  return (
    <>
      <Group
        selected={type}
        onSelect={setType}
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
          selected={time}
          onSelect={setTime}
          items={[
            {
              id: "15",
              text: "time 15",
              icon: "fa-clock",
            },
            {
              id: "60",
              text: "time 60",
              icon: "fa-clock",
            },
          ]}
        />
      </Show>
      <Show when={type() === "daily"}>
        <Group
          selected={language}
          onSelect={setLanguage}
          items={[
            "english",
            "french",
            "german",
            "indonesian",
            "italian",
            "portugese",
            "spanish",
          ].map((lang) => ({
            id: lang as Language,
            icon: "fa-globe",
            text: lang,
          }))}
        />
      </Show>
    </>
  );
}

function Group<T>(props: {
  items: { id: T; text: string; icon: FaSolidIcon }[];
  selected: Accessor<T>;
  onSelect: (selected: T) => void;
}): JSXElement {
  return (
    <div class="bg-sub-alt mb-4 grid gap-4 rounded-xl p-4">
      <For each={props.items}>
        {(item) => (
          <Button
            onClick={() => props.onSelect(item.id)}
            fa={{ icon: item.icon }}
            text={item.text}
            class="justify-start"
            active={item.id === props.selected()}
          />
        )}
      </For>
    </div>
  );
}
