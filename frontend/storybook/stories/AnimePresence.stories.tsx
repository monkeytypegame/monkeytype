import preview from "#.storybook/preview";
import { AnimationParams } from "animejs";
import { Component, createSignal, For, Show } from "solid-js";

import { Anime } from "../../src/ts/components/common/anime/Anime";
import { AnimePresence } from "../../src/ts/components/common/anime/AnimePresence";

const meta = preview.meta({
  title: "Common/Anime/AnimePresence",
  component: AnimePresence as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

const box = {
  padding: "16px 24px",
  "background-color": "var(--sub-alt-color)",
  color: "var(--text-color)",
  "border-radius": "8px",
  "margin-bottom": "8px",
};

export const SingleToggle = meta.story({
  render: () => {
    const [show, setShow] = createSignal(true);
    return (
      <div>
        <button
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            "background-color": "var(--sub-alt-color)",
            color: "var(--text-color)",
            border: "none",
            "border-radius": "8px",
            "margin-bottom": "16px",
          }}
          onClick={() => setShow((prev) => !prev)}
        >
          Toggle ({show() ? "visible" : "hidden"})
        </button>
        <AnimePresence>
          <Show when={show()}>
            <Anime
              initial={{ opacity: 0, scale: 0.8 } as Partial<AnimationParams>}
              animate={
                { opacity: 1, scale: 1, duration: 300 } as AnimationParams
              }
              exit={
                { opacity: 0, scale: 0.8, duration: 300 } as AnimationParams
              }
            >
              <div style={box}>Content with enter and exit animations</div>
            </Anime>
          </Show>
        </AnimePresence>
      </div>
    );
  },
});

export const ExitBeforeEnter = meta.story({
  render: () => {
    const [view, setView] = createSignal<"a" | "b">("a");
    const buttonStyle = (active: boolean) => ({
      padding: "8px 16px",
      cursor: "pointer",
      "background-color": active ? "var(--main-color)" : "var(--sub-alt-color)",
      color: active ? "var(--bg-color)" : "var(--text-color)",
      border: "none",
      "border-radius": "8px",
    });

    return (
      <div>
        <div style={{ display: "flex", gap: "8px", "margin-bottom": "16px" }}>
          <button
            style={buttonStyle(view() === "a")}
            onClick={() => setView("a")}
          >
            View A
          </button>
          <button
            style={buttonStyle(view() === "b")}
            onClick={() => setView("b")}
          >
            View B
          </button>
        </div>
        <AnimePresence exitBeforeEnter>
          <Show when={view() === "a"}>
            <Anime
              initial={
                { opacity: 0, translateX: -20 } as Partial<AnimationParams>
              }
              animate={
                { opacity: 1, translateX: 0, duration: 300 } as AnimationParams
              }
              exit={
                { opacity: 0, translateX: 20, duration: 300 } as AnimationParams
              }
            >
              <div style={box}>View A - exits before B enters</div>
            </Anime>
          </Show>
          <Show when={view() === "b"}>
            <Anime
              initial={
                { opacity: 0, translateX: -20 } as Partial<AnimationParams>
              }
              animate={
                { opacity: 1, translateX: 0, duration: 300 } as AnimationParams
              }
              exit={
                { opacity: 0, translateX: 20, duration: 300 } as AnimationParams
              }
            >
              <div style={box}>View B - exits before A enters</div>
            </Anime>
          </Show>
        </AnimePresence>
      </div>
    );
  },
});

export const ListMode = meta.story({
  render: () => {
    const [items, setItems] = createSignal([1, 2, 3]);
    let nextId = 4;

    return (
      <div>
        <div style={{ display: "flex", gap: "8px", "margin-bottom": "16px" }}>
          <button
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              "background-color": "var(--sub-alt-color)",
              color: "var(--text-color)",
              border: "none",
              "border-radius": "8px",
            }}
            onClick={() => setItems((prev) => [...prev, nextId++])}
          >
            Add item
          </button>
          <button
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              "background-color": "var(--sub-alt-color)",
              color: "var(--text-color)",
              border: "none",
              "border-radius": "8px",
            }}
            onClick={() => setItems((prev) => prev.slice(0, -1))}
          >
            Remove last
          </button>
        </div>
        <AnimePresence mode="list">
          <For each={items()}>
            {(item) => (
              <Anime
                initial={
                  { opacity: 0, translateX: -10 } as Partial<AnimationParams>
                }
                animate={
                  {
                    opacity: 1,
                    translateX: 0,
                    duration: 200,
                  } as AnimationParams
                }
                exit={
                  {
                    opacity: 0,
                    translateX: 10,
                    duration: 200,
                  } as AnimationParams
                }
              >
                <div style={box}>Item {item}</div>
              </Anime>
            )}
          </For>
        </AnimePresence>
      </div>
    );
  },
});
