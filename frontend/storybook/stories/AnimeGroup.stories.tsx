import preview from "#.storybook/preview";
import { AnimationParams } from "animejs";
import { Component, createSignal, For } from "solid-js";

import { AnimeGroup } from "../../src/ts/components/common/anime/AnimeGroup";

const meta = preview.meta({
  title: "Common/Anime/AnimeGroup",
  component: AnimeGroup as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

const itemStyle = {
  padding: "12px 24px",
  "background-color": "var(--sub-alt-color)",
  color: "var(--text-color)",
  "border-radius": "8px",
  "margin-bottom": "4px",
};

export const StaggeredFadeIn = meta.story({
  render: () => (
    <AnimeGroup
      initial={{ opacity: 0, translateY: -10 } as Partial<AnimationParams>}
      animation={
        { opacity: 1, translateY: 0, duration: 400 } as AnimationParams
      }
      stagger={80}
    >
      <div style={itemStyle}>First</div>
      <div style={itemStyle}>Second</div>
      <div style={itemStyle}>Third</div>
      <div style={itemStyle}>Fourth</div>
      <div style={itemStyle}>Fifth</div>
    </AnimeGroup>
  ),
});

export const ReverseDirection = meta.story({
  render: () => (
    <AnimeGroup
      initial={{ opacity: 0, translateX: -20 } as Partial<AnimationParams>}
      animation={
        { opacity: 1, translateX: 0, duration: 300 } as AnimationParams
      }
      stagger={100}
      direction="reverse"
    >
      <div style={itemStyle}>Item 1</div>
      <div style={itemStyle}>Item 2</div>
      <div style={itemStyle}>Item 3</div>
      <div style={itemStyle}>Item 4</div>
    </AnimeGroup>
  ),
});

export const CenterDirection = meta.story({
  render: () => (
    <AnimeGroup
      initial={{ opacity: 0, scale: 0.5 } as Partial<AnimationParams>}
      animation={{ opacity: 1, scale: 1, duration: 400 } as AnimationParams}
      stagger={80}
      direction="center"
      class="flex gap-2"
    >
      <div
        style={{
          ...itemStyle,
          width: "60px",
          "text-align": "center",
          "margin-bottom": "0",
        }}
      >
        1
      </div>
      <div
        style={{
          ...itemStyle,
          width: "60px",
          "text-align": "center",
          "margin-bottom": "0",
        }}
      >
        2
      </div>
      <div
        style={{
          ...itemStyle,
          width: "60px",
          "text-align": "center",
          "margin-bottom": "0",
        }}
      >
        3
      </div>
      <div
        style={{
          ...itemStyle,
          width: "60px",
          "text-align": "center",
          "margin-bottom": "0",
        }}
      >
        4
      </div>
      <div
        style={{
          ...itemStyle,
          width: "60px",
          "text-align": "center",
          "margin-bottom": "0",
        }}
      >
        5
      </div>
    </AnimeGroup>
  ),
});

export const WithExitAnimation = meta.story({
  render: () => {
    const [items, setItems] = createSignal(["A", "B", "C", "D"]);
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
            onClick={() =>
              setItems((prev) => [
                ...prev,
                String.fromCodePoint(65 + prev.length),
              ])
            }
          >
            Add
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
            Remove
          </button>
        </div>
        <AnimeGroup
          initial={{ opacity: 0, translateX: -15 } as Partial<AnimationParams>}
          animation={
            { opacity: 1, translateX: 0, duration: 300 } as AnimationParams
          }
          exit={
            { opacity: 0, translateX: 15, duration: 200 } as AnimationParams
          }
          stagger={60}
        >
          <For each={items()}>
            {(item) => <div style={itemStyle}>Item {item}</div>}
          </For>
        </AnimeGroup>
      </div>
    );
  },
});
