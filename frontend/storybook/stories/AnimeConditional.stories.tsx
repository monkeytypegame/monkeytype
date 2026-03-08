import preview from "#.storybook/preview";
import { Accessor, Component, createSignal, JSXElement } from "solid-js";

import { AnimeConditional } from "../../src/ts/components/common/anime/AnimeConditional";

type AnimeConditionalProps = {
  if: boolean;
  then: JSXElement | ((value: Accessor<NonNullable<boolean>>) => JSXElement);
  else?: JSXElement;
  exitBeforeEnter?: boolean;
};

const meta = preview.meta({
  title: "Common/Anime/AnimeConditional",
  component: AnimeConditional as Component<AnimeConditionalProps>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    if: { control: "boolean" },
    exitBeforeEnter: { control: "boolean" },
  },
});

export const Default = meta.story({
  args: {
    if: true,
    exitBeforeEnter: true,
    then: (
      <div style={{ color: "var(--text-color)", padding: "16px" }}>
        Condition is true
      </div>
    ),
    else: (
      <div style={{ color: "var(--error-color)", padding: "16px" }}>
        Condition is false
      </div>
    ),
  },
});

export const InteractiveToggle = meta.story({
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
          Toggle ({show() ? "showing true" : "showing false"})
        </button>
        <AnimeConditional
          if={show()}
          exitBeforeEnter
          then={
            <div style={{ color: "var(--text-color)", padding: "16px" }}>
              Condition is true
            </div>
          }
          else={
            <div style={{ color: "var(--error-color)", padding: "16px" }}>
              Condition is false
            </div>
          }
        />
      </div>
    );
  },
});
