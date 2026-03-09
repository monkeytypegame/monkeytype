import {
  createMemo,
  createResource,
  createSignal,
  For,
  JSXElement,
  Show,
} from "solid-js";

import { cachedFetchJson } from "../../utils/json-data";
import { AnimatedModal } from "../common/AnimatedModal";

type FaqContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

type FaqTopic = {
  title: string;
  searchText: string;
  content: FaqContentBlock[];
};

type FaqData = {
  topics: FaqTopic[];
};

async function getFaqData(): Promise<FaqData> {
  return cachedFetchJson<FaqData>("/faq.json");
}

function RenderContent(props: { blocks: FaqContentBlock[] }): JSXElement {
  return (
    <div class="flex flex-col gap-4">
      <For each={props.blocks}>
        {(block) => (
          <Show
            when={block.type === "list"}
            fallback={
              <p>{(block as { type: "paragraph"; text: string }).text}</p>
            }
          >
            <ul class="flex list-disc flex-col gap-2 pl-4">
              <For each={(block as { type: "list"; items: string[] }).items}>
                {(item) => <li>{item}</li>}
              </For>
            </ul>
          </Show>
        )}
      </For>
    </div>
  );
}

export function FaqModal(): JSXElement {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [search, setSearch] = createSignal("");
  const [faqData] = createResource(getFaqData);

  const filteredTopics = createMemo(() => {
    const topics = faqData()?.topics ?? [];
    const q = search().toLowerCase().trim();
    if (q === "") return topics.map((t, i) => ({ ...t, originalIndex: i }));
    return topics
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
          class="w-full rounded bg-sub-alt px-3 py-2 text-sm text-text placeholder-sub [color-scheme:dark] outline-none focus-visible:shadow-none"
          value={search()}
          onInput={(e) => {
            setSearch(e.currentTarget.value);
          }}
        />
        <div class="grid min-h-0 flex-1 grid-cols-[12rem_1fr] gap-4 overflow-hidden">
          <div class="flex min-h-0 flex-col gap-1 overflow-y-auto pr-2">
            <Show
              when={!faqData.loading}
              fallback={<div class="p-2 text-sm text-sub">Loading...</div>}
            >
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
            </Show>
          </div>
          <div class="overflow-y-auto text-sm text-sub">
            <Show when={effectiveIndex() !== -1 && !faqData.loading}>
              <RenderContent
                blocks={faqData()?.topics[effectiveIndex()]?.content ?? []}
              />
            </Show>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
}
