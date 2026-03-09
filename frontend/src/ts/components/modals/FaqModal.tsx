import { createMemo, createSignal, For, JSXElement, Show } from "solid-js";

import { AnimatedModal } from "../common/AnimatedModal";

type FaqTopic = {
  title: string;
  content: JSXElement;
  searchText: string;
};

const faqTopics: FaqTopic[] = [
  {
    title: "How do I type coding symbols?",
    searchText:
      "coding symbols punctuation quotes custom text code special characters",
    content: (
      <div class="flex flex-col gap-4">
        <p>There are two ways to type coding symbols in Monkeytype:</p>
        <ul class="flex list-disc flex-col gap-2 pl-4">
          <li>
            <span class="text-text">Punctuation mode</span> - Enable it by
            clicking the <span class="text-text">@ punctuation</span> button in
            the test config bar. This adds common symbols like{" "}
            <span class="text-text">! , . ; : &apos; &quot; ( )</span>
          </li>
          <li>
            <span class="text-text">Quote mode</span> - Switch to{" "}
            <span class="text-text">quote</span> mode in the test config bar.
            Quotes often contain real code-like punctuation and symbols.
          </li>
          <li>
            <span class="text-text">Custom text</span> - Use the command line{" "}
            <span class="text-text">(Ctrl + Shift + P)</span> and select
            &quot;custom text&quot; to type any text you want, including code.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "How do I restart the test quickly?",
    searchText: "restart test quickly tab enter esc shortcut keyboard",
    content: (
      <div class="flex flex-col gap-4">
        <p>You can restart the test without touching the mouse:</p>
        <ul class="flex list-disc flex-col gap-2 pl-4">
          <li>
            Press <span class="text-text">Tab + Enter</span> - the default
            shortcut to restart.
          </li>
          <li>
            Enable <span class="text-text">Quick Restart</span> mode in settings
            - restart with <span class="text-text">Tab or Esc or Enter</span>.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "How do I change the language?",
    searchText: "language change switch foreign english spanish french german",
    content: (
      <div class="flex flex-col gap-4">
        <p>
          Search <span class="text-text">language</span> in command line. A list
          of all available languages will appear - select the one you want.
        </p>
        <p>Monkeytype supports multiple languages.</p>
      </div>
    ),
  },
  {
    title: "How do I change the theme?",
    searchText: "theme color appearance dark light custom random palette",
    content: (
      <div class="flex flex-col gap-4">
        <p>There are several ways to change the theme:</p>
        <ul class="flex list-disc flex-col gap-2 pl-4">
          <li>
            Open the <span class="text-text">command line</span> with{" "}
            <span class="text-text">Ctrl + Shift + P</span> and search for a
            theme name.
          </li>
          <li>
            Go to <span class="text-text">Settings → Theme</span> and browse the
            full list.
          </li>
          <li>
            Enable <span class="text-text">random theme</span> in settings to
            get a new theme on every test. After completing a test, the theme
            will be set to a random one. The random themes are not saved to your
            config. If set to &apos;favorite&apos; only favorite themes will be
            randomized. If set to &apos;light&apos; or &apos;dark&apos;, only
            presets with light or dark background colors will be randomized. If
            set to &apos;auto&apos;, dark or light themes are used depending on
            your system theme. If set to &apos;custom&apos;, custom themes will
            be randomized.
          </li>
          <li>
            Click the <span class="text-text">palette icon</span> in the footer
            to quickly switch themes.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "How do I save my progress?",
    searchText: "save progress account history personal best login signup",
    content: (
      <div class="flex flex-col gap-4">
        <p>
          To save your typing history and personal bests, create a free account.
        </p>
        <p>
          Click the <span class="text-text">person icon</span> in the top right
          to sign up or log in. Once logged in, all your results are
          automatically saved.
        </p>
        <p>
          Without an account, results are only stored temporarily in your
          browser session.
        </p>
      </div>
    ),
  },
  {
    title: "How do the leaderboards work?",
    searchText:
      "leaderboard rank top fastest qualify anticheat english 15 60 seconds",
    content: (
      <div class="flex flex-col gap-4">
        <p>
          The global leaderboards track the fastest typists for{" "}
          <span class="text-text">15 second</span> and{" "}
          <span class="text-text">60 second</span> English tests.
        </p>
        <p>To qualify, your result must:</p>
        <ul class="flex list-disc flex-col gap-2 pl-4">
          <li>Be completed while logged in</li>
          <li>
            Use the <span class="text-text">English</span> language
          </li>
          <li>Have no funbox modifiers active</li>
          <li>Pass the anticheat verification</li>
        </ul>
      </div>
    ),
  },
  {
    title: "What is Blind Mode?",
    searchText: "blind mode errors hide mistakes accuracy training",
    content: (
      <div class="flex flex-col gap-4">
        <p>
          Blind mode hides your errors while typing - you won&apos;t see red
          characters or highlights during the test.
        </p>
        <p>
          This is useful for training yourself to keep typing without fixating
          on mistakes. Accuracy is still tracked and shown at the end.
        </p>
        <p>
          Enable it in{" "}
          <span class="text-text">Settings → Behavior → Blind Mode</span>.
        </p>
      </div>
    ),
  },
  {
    title: "What is Pace Caret?",
    searchText: "pace caret target speed race wpm goal second caret",
    content: (
      <div class="flex flex-col gap-4">
        <p>
          The pace caret is a second caret that moves at a target speed so you
          can race against it.
        </p>
        <p>
          Set it to your personal best, average, or a custom WPM target in{" "}
          <span class="text-text">Settings → Caret → Pace Caret</span>.
        </p>
      </div>
    ),
  },
  {
    title: "What are Funbox modes?",
    searchText: "funbox fun modes gibberish numbers challenge special modifier",
    content: (
      <div class="flex flex-col gap-4">
        <p>
          Funbox modes are special modifiers that change how the test works.
          Examples:
        </p>
        <ul class="flex list-disc flex-col gap-2 pl-4">
          <li>
            <span class="text-text">gibberish</span> - random nonsense words
          </li>
          <li>
            <span class="text-text">58008</span> - only numbers
          </li>
          <li>
            <span class="text-text">read ahead</span> - hides the current word
          </li>
          <li>
            <span class="text-text">no quit</span> - forces you to finish
          </li>
        </ul>
        <p>
          Access via <span class="text-text">Ctrl + Shift + P</span> → funbox.
        </p>
      </div>
    ),
  },
  {
    title: "How do I use Custom Text?",
    searchText: "custom text paste own code lyrics repeat randomize",
    content: (
      <div class="flex flex-col gap-4">
        <p>
          Custom text lets you type any text you want - code, prose, lyrics.
        </p>
        <p>
          Open the command line with{" "}
          <span class="text-text">Ctrl + Shift + P</span>, search for{" "}
          <span class="text-text">custom text</span>, and paste your content.
          You can also set it to repeat or randomize word order.
        </p>
      </div>
    ),
  },
];

export function FaqModal(): JSXElement {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [search, setSearch] = createSignal("");

  const filteredTopics = createMemo(() => {
    const q = search().toLowerCase().trim();
    if (q === "") return faqTopics.map((t, i) => ({ ...t, originalIndex: i }));
    return faqTopics
      .map((t, i) => ({ ...t, originalIndex: i }))
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.searchText.toLowerCase().includes(q),
      );
  });

  const effectiveIndex = createMemo(() => {
    const topics = filteredTopics();
    if (topics.length === 0) return -1;
    const found = topics.find((t) => t.originalIndex === selectedIndex());
    if (found !== undefined) return selectedIndex();
    setSelectedIndex(topics[0]?.originalIndex ?? 0);
    return topics[0]?.originalIndex ?? 0;
  });

  return (
    <AnimatedModal
      id="Faq"
      title="FAQ"
      modalClass="max-w-4xl h-[36rem] grid-rows-[auto_1fr]"
    >
      <div
        class="-mt-1 grid h-full gap-3 overflow-hidden"
        style={{ "grid-template-rows": "auto 1fr" }}
      >
        <input
          type="text"
          placeholder="Search..."
          class="w-full rounded bg-sub-alt px-3 py-2 text-sm text-text placeholder-sub outline-none focus-visible:shadow-none"
          value={search()}
          onInput={(e) => {
            setSearch(e.currentTarget.value);
          }}
        />
        <div class="grid min-h-0 flex-1 grid-cols-[12rem_1fr] gap-4 overflow-hidden">
          <div class="flex min-h-0 flex-col gap-1 overflow-y-auto pr-2">
            <Show
              when={filteredTopics().length > 0}
              fallback={
                <div class="p-2 text-sm text-sub">No results found.</div>
              }
            >
              <For each={filteredTopics()}>
                {(topic) => (
                  <button
                    type="button"
                    class="rounded p-2 text-left text-sm transition-colors"
                    classList={{
                      "bg-text text-bg":
                        effectiveIndex() === topic.originalIndex,
                      "text-sub hover:text-bg hover:bg-text":
                        effectiveIndex() !== topic.originalIndex,
                    }}
                    onClick={() => setSelectedIndex(topic.originalIndex)}
                  >
                    {topic.title}
                  </button>
                )}
              </For>
            </Show>
          </div>
          <div class="overflow-y-auto text-sm text-sub">
            <Show when={effectiveIndex() !== -1}>
              {faqTopics[effectiveIndex()]?.content}
            </Show>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
}
