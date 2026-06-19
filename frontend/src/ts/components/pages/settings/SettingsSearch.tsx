import {
  createSignal,
  For,
  JSXElement,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { useRef } from "../../../hooks/useRef";
import { FaSolidIcon } from "../../../types/font-awesome";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { highlightSetting } from "./highlight";

type SettingEntry = {
  key: string;
  title: string;
  icon: FaSolidIcon;
};

const MAX_RESULTS = 8;

// snapshot every setting currently rendered on the page so search only ever
// offers (and jumps to) settings that are actually visible
function collectSettings(): SettingEntry[] {
  const page = document.querySelector('[data-component="settingspage"]');
  if (page === null) return [];

  return [...page.querySelectorAll<HTMLElement>("[data-setting-key]")].map(
    (element) => {
      const heading = element.querySelector("h3");
      const icon = [...(heading?.querySelector("i")?.classList ?? [])].find(
        (className) =>
          className.startsWith("fa-") &&
          className !== "fa-fw" &&
          className !== "fa-spin",
      );
      const key = element.dataset["settingKey"] ?? "";
      return {
        key,
        title: heading?.textContent?.trim() ?? key,
        // the class came from a rendered solid <Fa>, so it is a valid icon name
        icon: (icon ?? "fa-cog") as FaSolidIcon,
      };
    },
  );
}

export function SettingsSearch(): JSXElement {
  const [query, setQuery] = createSignal("");
  const [entries, setEntries] = createSignal<SettingEntry[]>([]);
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [isOpen, setIsOpen] = createSignal(false);

  const [containerRef, container] = useRef<HTMLDivElement>();

  // close the suggestions when clicking anywhere outside the search
  onMount(() => {
    const onClick = (e: MouseEvent): void => {
      const el = container();
      if (el && !el.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("click", onClick);
    onCleanup(() => document.removeEventListener("click", onClick));
  });

  const results = (): SettingEntry[] => {
    const needle = query().trim().toLowerCase();
    if (needle === "") return [];
    return entries()
      .filter(
        (entry) =>
          entry.title.toLowerCase().includes(needle) ||
          entry.key.toLowerCase().includes(needle),
      )
      .slice(0, MAX_RESULTS);
  };

  const select = (entry: SettingEntry): void => {
    highlightSetting(entry.key);
    setQuery("");
    setIsOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    const current = results();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, current.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = current[activeIndex()];
      if (entry !== undefined) select(entry);
    } else if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
    }
  };

  return (
    <div class="relative" ref={containerRef}>
      <Fa
        icon="fa-search"
        class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sub"
      />
      <input
        class={cn(
          "w-full rounded border-none bg-sub-alt py-3 pr-4 pl-10",
          "text-em-base text-text caret-main outline-none placeholder:text-sub",
          "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
        )}
        type="text"
        placeholder="search settings"
        autocomplete="off"
        value={query()}
        onFocus={() => {
          setEntries(collectSettings());
          setIsOpen(true);
        }}
        onInput={(e) => {
          setQuery(e.currentTarget.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <Show when={isOpen() && results().length > 0}>
        <div
          class={cn(
            "absolute top-full right-0 left-0 z-10 mt-2",
            "grid gap-1 rounded bg-sub-alt p-2 text-em-sm",
          )}
        >
          <For each={results()}>
            {(entry, index) => (
              <Button
                variant="text"
                active={index() === activeIndex()}
                class="justify-start gap-4 px-3 py-2"
                fa={{ icon: entry.icon }}
                text={entry.title}
                onClick={() => select(entry)}
                onMouseEnter={() => setActiveIndex(index())}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
