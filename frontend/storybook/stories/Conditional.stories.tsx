import preview from "#.storybook/preview";
import { Component, JSXElement } from "solid-js";

import { Conditional } from "../../src/ts/components/common/Conditional";

type ConditionalProps = {
  if: boolean;
  then: JSXElement;
  else?: JSXElement;
};

const meta = preview.meta({
  title: "Common/Conditional",
  component: Conditional as Component<ConditionalProps>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    if: { control: "boolean" },
  },
});

export const Truthy = meta.story({
  args: {
    if: true,
    then: <div style={{ color: "var(--text-color)" }}>Condition is true</div>,
    else: <div style={{ color: "var(--error-color)" }}>Condition is false</div>,
  },
});

export const Falsy = meta.story({
  args: {
    if: false,
    then: <div style={{ color: "var(--text-color)" }}>Condition is true</div>,
    else: <div style={{ color: "var(--error-color)" }}>Condition is false</div>,
  },
});

export const NoFallback = meta.story({
  args: {
    if: true,
    then: <div style={{ color: "var(--text-color)" }}>Visible content</div>,
  },
});

export const FalsyNoFallback = meta.story({
  args: {
    if: false,
    then: <div style={{ color: "var(--text-color)" }}>Hidden content</div>,
  },
});
