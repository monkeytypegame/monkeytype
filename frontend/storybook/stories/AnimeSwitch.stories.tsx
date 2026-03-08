import preview from "#.storybook/preview";
import { Component, createSignal } from "solid-js";

import { AnimeMatch } from "../../src/ts/components/common/anime/AnimeMatch";
import { AnimeSwitch } from "../../src/ts/components/common/anime/AnimeSwitch";

const meta = preview.meta({
  title: "Common/Anime/AnimeSwitch",
  component: AnimeSwitch as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => {
    const [tab, setTab] = createSignal<"a" | "b" | "c">("a");
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
            style={buttonStyle(tab() === "a")}
            onClick={() => setTab("a")}
          >
            Tab A
          </button>
          <button
            style={buttonStyle(tab() === "b")}
            onClick={() => setTab("b")}
          >
            Tab B
          </button>
          <button
            style={buttonStyle(tab() === "c")}
            onClick={() => setTab("c")}
          >
            Tab C
          </button>
        </div>
        <AnimeSwitch
          exitBeforeEnter
          animeProps={{
            initial: { opacity: 0 },
            animate: { opacity: 1, duration: 200 },
            exit: { opacity: 0, duration: 200 },
          }}
        >
          <AnimeMatch when={tab() === "a"}>
            <div style={{ color: "var(--text-color)", padding: "16px" }}>
              Content for Tab A
            </div>
          </AnimeMatch>
          <AnimeMatch when={tab() === "b"}>
            <div style={{ color: "var(--text-color)", padding: "16px" }}>
              Content for Tab B
            </div>
          </AnimeMatch>
          <AnimeMatch when={tab() === "c"}>
            <div style={{ color: "var(--text-color)", padding: "16px" }}>
              Content for Tab C
            </div>
          </AnimeMatch>
        </AnimeSwitch>
      </div>
    );
  },
});
