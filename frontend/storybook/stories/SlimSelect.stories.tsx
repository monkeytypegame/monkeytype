import preview from "#.storybook/preview";
import { Component, createSignal } from "solid-js";
import { fn } from "storybook/test";

import SlimSelect from "../../src/ts/components/ui/SlimSelect";

const meta = preview.meta({
  title: "UI/SlimSelect",
  component: SlimSelect as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onChange: fn(),
  },
});

export const Default = meta.story({
  render: () => {
    const [selected, setSelected] = createSignal<string | undefined>("banana");
    return (
      <div style={{ width: "200px" }}>
        <SlimSelect
          options={[
            { value: "apple", text: "Apple" },
            { value: "banana", text: "Banana" },
            { value: "cherry", text: "Cherry" },
            { value: "date", text: "Date" },
          ]}
          selected={selected()}
          onChange={(val) => setSelected(val)}
        />
      </div>
    );
  },
});

export const WithValues = meta.story({
  render: () => {
    const [selected, setSelected] = createSignal<string | undefined>("15");
    return (
      <div style={{ width: "200px" }}>
        <SlimSelect
          values={["15", "30", "60", "120"]}
          selected={selected()}
          onChange={(val) => setSelected(val)}
        />
      </div>
    );
  },
});

export const Multiple = meta.story({
  render: () => {
    const [selected, setSelected] = createSignal<string[]>(["red", "blue"]);
    return (
      <div style={{ width: "300px" }}>
        <SlimSelect
          multiple
          options={[
            { value: "red", text: "Red" },
            { value: "green", text: "Green" },
            { value: "blue", text: "Blue" },
            { value: "yellow", text: "Yellow" },
            { value: "purple", text: "Purple" },
          ]}
          selected={selected()}
          onChange={(val) => setSelected(val)}
        />
      </div>
    );
  },
});

export const MultipleWithAll = meta.story({
  render: () => {
    const [selected, setSelected] = createSignal<string[]>([
      "english",
      "spanish",
      "french",
    ]);
    return (
      <div style={{ width: "300px" }}>
        <SlimSelect
          multiple
          options={[
            { value: "english", text: "English" },
            { value: "spanish", text: "Spanish" },
            { value: "french", text: "French" },
            { value: "german", text: "German" },
          ]}
          selected={selected()}
          onChange={(val) => setSelected(val)}
          settings={{ addAllOption: true }}
        />
      </div>
    );
  },
});

export const TwoWayBinding = meta.story({
  render: () => {
    const options = [
      { value: "apple", text: "Apple" },
      { value: "banana", text: "Banana" },
      { value: "cherry", text: "Cherry" },
      { value: "date", text: "Date" },
    ];
    const [selected, setSelected] = createSignal<string | undefined>("banana");

    const buttonStyle = (active: boolean) => ({
      padding: "4px 12px",
      cursor: "pointer",
      "background-color": active ? "var(--main-color)" : "var(--sub-alt-color)",
      color: active ? "var(--bg-color)" : "var(--text-color)",
      border: "none",
      "border-radius": "4px",
    });

    return (
      <div style={{ width: "250px" }}>
        <SlimSelect
          options={options}
          selected={selected()}
          onChange={(val) => setSelected(val)}
        />
        <div
          style={{
            display: "flex",
            gap: "4px",
            "margin-top": "12px",
            "flex-wrap": "wrap",
          }}
        >
          {options.map((opt) => (
            <button
              style={buttonStyle(selected() === opt.value)}
              onClick={() => setSelected(opt.value)}
            >
              {opt.text}
            </button>
          ))}
        </div>
        <p style={{ color: "var(--sub-color)", "margin-top": "8px" }}>
          Selected: {selected() ?? "none"}
        </p>
      </div>
    );
  },
});

export const Searchable = meta.story({
  render: () => {
    const [selected, setSelected] = createSignal<string | undefined>(undefined);
    return (
      <div style={{ width: "250px" }}>
        <SlimSelect
          options={Array.from({ length: 50 }, (_, i) => ({
            value: `option-${i + 1}`,
            text: `Option ${i + 1}`,
          }))}
          selected={selected()}
          onChange={(val) => setSelected(val)}
          settings={{ placeholderText: "Search options..." }}
        />
      </div>
    );
  },
});
