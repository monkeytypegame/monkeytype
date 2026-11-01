import type { Optgroup } from "slim-select/store";

import { cleanup, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockOption = {
  value?: string;
  text?: string;
  selected?: boolean;
  label?: string;
  options?: MockOption[];
};

type MockConfig = {
  data: MockOption[];
  events: {
    beforeChange: (
      selected: MockOption[],
      oldSelected: MockOption[],
    ) => boolean | undefined;
    afterChange: (selected: MockOption[]) => void;
  };
};

const { instances, MockSlimSelect } = vi.hoisted(() => {
  const instances: MockSlimSelectType[] = [];

  class MockSlimSelectType {
    config: MockConfig;
    data: MockOption[];
    store: {
      setData: ReturnType<typeof vi.fn>;
      getData: () => MockOption[];
    };
    render = {
      renderValues: vi.fn(),
      renderOptions: vi.fn(),
    };
    setSelected = vi.fn();
    destroy = vi.fn();
    enable = vi.fn();
    disable = vi.fn();

    constructor(config: MockConfig) {
      this.config = config;
      this.data = config.data;
      this.store = {
        setData: vi.fn((data: MockOption[]) => {
          this.data = data;
        }),
        getData: () => this.data,
      };
      instances.push(this);
    }
  }

  return { instances, MockSlimSelect: MockSlimSelectType };
});

vi.mock("slim-select", () => ({ default: MockSlimSelect }));

import SlimSelect from "../../../src/ts/components/ui/SlimSelect";

const optionA = { value: "a", text: "A" };
const optionB = { value: "b", text: "B" };
const optionC = { value: "c", text: "C" };
const options = [optionA, optionB, optionC];

function instance(): InstanceType<typeof MockSlimSelect> {
  const last = instances[instances.length - 1];
  if (last === undefined) throw new Error("SlimSelect not constructed");
  return last;
}

function selectedValues(data: MockOption[]): (string | undefined)[] {
  return data
    .flatMap((item) => item.options ?? [item])
    .filter((o) => o.selected)
    .map((o) => o.value);
}

/** Runs the post-mount animation frames (isInitializing -> false). */
function flushFrames(): void {
  vi.advanceTimersByTime(100);
}

describe("SlimSelect", () => {
  beforeEach(() => {
    instances.length = 0;
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame"],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe("mount", () => {
    it("passes the selection in the initial data and does not re-select", () => {
      render(() => <SlimSelect options={options} selected="b" />);
      flushFrames();

      expect(selectedValues(instance().config.data)).toEqual(["b"]);
      expect(instance().setSelected).not.toHaveBeenCalled();
    });

    it("passes the selection in the initial option groups", () => {
      render(() => (
        <SlimSelect
          multiple
          optionGroups={
            [
              { label: "first", options: [optionA, optionB] },
              { label: "second", options: [optionC] },
            ] as Optgroup[]
          }
          selected={["a", "c"]}
        />
      ));
      flushFrames();

      expect(selectedValues(instance().config.data)).toEqual(["a", "c"]);
      expect(instance().setSelected).not.toHaveBeenCalled();
    });

    it("keeps the groups' own selection without a selected prop", () => {
      const groups = [
        {
          label: "first",
          options: [{ ...optionA, selected: true }, optionB],
        },
      ] as Optgroup[];
      render(() => <SlimSelect optionGroups={groups} />);

      expect(instance().config.data).toBe(groups);
    });
  });

  describe("selection changes", () => {
    it("calls onChange when the user picks a value, without re-selecting", () => {
      const [selected, setSelected] = createSignal("a");
      const onChange = vi.fn((value: string | undefined) => {
        if (value !== undefined) setSelected(value);
      });
      render(() => (
        <SlimSelect
          options={options}
          selected={selected()}
          onChange={onChange}
        />
      ));
      flushFrames();

      const picked = [{ value: "b", text: "B", selected: true }];
      instance().config.events.beforeChange(picked, [
        { value: "a", text: "A", selected: true },
      ]);
      instance().config.events.afterChange(picked);

      expect(onChange).toHaveBeenCalledWith("b");
      expect(selected()).toBe("b");
      expect(instance().setSelected).not.toHaveBeenCalled();
    });

    it("re-selects when the selected prop changes externally", () => {
      const [selected, setSelected] = createSignal("a");
      render(() => <SlimSelect options={options} selected={selected()} />);
      flushFrames();

      setSelected("c");

      expect(instance().setSelected).toHaveBeenCalledWith(["c"], false);
    });

    it("re-selects when a selected store array is mutated in place", () => {
      const [state, setState] = createStore({ selected: ["a", "b"] });
      render(() => (
        <SlimSelect multiple options={options} selected={state.selected} />
      ));
      flushFrames();

      // these write into the existing array instead of replacing it. the
      // second change used to be missed once the first had been synced
      setState("selected", 2, "c");
      expect(instance().setSelected).toHaveBeenLastCalledWith(
        ["a", "b", "c"],
        false,
      );

      setState("selected", 0, "d");
      expect(instance().setSelected).toHaveBeenCalledTimes(2);
      expect(instance().setSelected).toHaveBeenLastCalledWith(
        ["d", "b", "c"],
        false,
      );
    });
  });

  describe("options changes", () => {
    it("does not rebuild options when the same array is passed", () => {
      render(() => <SlimSelect options={options} selected="a" />);
      flushFrames();

      expect(instance().store.setData).not.toHaveBeenCalled();
      expect(instance().render.renderOptions).not.toHaveBeenCalled();
    });

    it("rebuilds options when a new array is passed", () => {
      const [opts, setOpts] = createSignal(options);
      render(() => <SlimSelect options={opts()} selected="a" />);
      flushFrames();

      setOpts([...options, { value: "d", text: "D" }]);

      expect(instance().store.setData).toHaveBeenCalled();
      expect(instance().render.renderOptions).toHaveBeenCalled();
    });
  });

  describe("addAllOption", () => {
    it("shows the all state when everything is selected on mount", () => {
      render(() => (
        <SlimSelect
          multiple
          settings={{ addAllOption: true }}
          options={options}
          selected={["a", "b", "c"]}
        />
      ));

      const firstSetData = instance().store.setData.mock.calls[0]?.[0] as
        | MockOption[]
        | undefined;
      expect(firstSetData).toBeDefined();
      expect(firstSetData?.find((o) => o.value === "all")?.selected).toBe(true);
      expect(instance().render.renderValues).toHaveBeenCalled();
    });
  });
});
