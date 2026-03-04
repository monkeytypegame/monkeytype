import preview from "#.storybook/preview";
import { Accessor, Component, JSXElement } from "solid-js";

import { AnimeConditional } from "../../src/ts/components/common/anime/AnimeConditional";

type AnimeConditionalProps = {
  if: boolean;
  then: JSXElement | ((value: Accessor<NonNullable<boolean>>) => JSXElement);
  else?: JSXElement;
  exitBeforeEnter?: boolean;
};

const meta = preview.meta({
  title: "Monkeytype/AnimeConditional",
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
