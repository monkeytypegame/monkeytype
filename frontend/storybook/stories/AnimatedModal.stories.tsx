import { Component } from "solid-js";

import preview from "#.storybook/preview";

import { AnimatedModal } from "../../src/ts/components/common/AnimatedModal";
import { ModalId, showModal } from "../../src/ts/states/modals";

function ModalTrigger(props: { modalId: ModalId; label: string }) {
  return (
    <button
      style={{
        padding: "8px 16px",
        cursor: "pointer",
        "background-color": "var(--sub-alt-color)",
        color: "var(--text-color)",
        border: "none",
        "border-radius": "8px",
      }}
      onClick={() => showModal(props.modalId)}
    >
      {props.label}
    </button>
  );
}

const meta = preview.meta({
  title: "Common/AnimatedModal",
  component: AnimatedModal as Component,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => (
    <>
      <ModalTrigger modalId="Contact" label="Open Example Modal" />
      <AnimatedModal id="Contact" title="Example Modal">
        <div>
          <p>This is modal content.</p>
        </div>
      </AnimatedModal>
    </>
  ),
});

export const NoAnimation = meta.story({
  render: () => (
    <>
      <ModalTrigger modalId="Support" label="Open No Animation Modal" />
      <AnimatedModal
        id="Support"
        title="No Animation Modal"
        animationMode="none"
      >
        <div>
          <p>This modal has no animation.</p>
        </div>
      </AnimatedModal>
    </>
  ),
});

export const DialogMode = meta.story({
  render: () => (
    <>
      <ModalTrigger modalId="DevOptions" label="Open Dialog Mode" />
      <AnimatedModal id="DevOptions" mode="dialog" title="Dialog Mode">
        <div>
          <p>This uses dialog mode instead of modal.</p>
        </div>
      </AnimatedModal>
    </>
  ),
});
