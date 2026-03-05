import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { Conditional } from "../../../src/ts/components/common/Conditional";

describe("Conditional", () => {
  afterEach(() => {
    cleanup();
  });

  describe("static rendering", () => {
    it("renders then when if is true", () => {
      render(() => <Conditional if={true} then={<div>then content</div>} />);

      expect(screen.getByText("then content")).toBeInTheDocument();
    });

    it("renders then when if is a truthy object", () => {
      render(() => (
        <Conditional if={{ value: 42 }} then={<div>then content</div>} />
      ));

      expect(screen.getByText("then content")).toBeInTheDocument();
    });

    it("renders then when if is a truthy string", () => {
      render(() => <Conditional if="hello" then={<div>then content</div>} />);

      expect(screen.getByText("then content")).toBeInTheDocument();
    });

    it("renders else fallback when if is false", () => {
      render(() => (
        <Conditional
          if={false}
          then={<div>then content</div>}
          else={<div>else content</div>}
        />
      ));

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(screen.getByText("else content")).toBeInTheDocument();
    });

    it("renders else fallback when if is null", () => {
      render(() => (
        <Conditional
          if={null}
          then={<div>then content</div>}
          else={<div>else content</div>}
        />
      ));

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(screen.getByText("else content")).toBeInTheDocument();
    });

    it("renders else fallback when if is undefined", () => {
      render(() => (
        <Conditional
          if={undefined}
          then={<div>then content</div>}
          else={<div>else content</div>}
        />
      ));

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(screen.getByText("else content")).toBeInTheDocument();
    });

    it("renders else fallback when if is 0", () => {
      render(() => (
        <Conditional
          if={0}
          then={<div>then content</div>}
          else={<div>else content</div>}
        />
      ));

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(screen.getByText("else content")).toBeInTheDocument();
    });

    it("renders nothing when if is falsy and else is not provided", () => {
      const { container } = render(() => (
        <Conditional if={false} then={<div>then content</div>} />
      ));

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  describe("then as function", () => {
    it("passes the truthy value to then function", () => {
      const obj: { label: string } | null = { label: "hello" };
      render(() => (
        <Conditional if={obj} then={(value) => <div>{value().label}</div>} />
      ));

      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    it("does not call then function when if is falsy", () => {
      const obj: { label: string } | null = null;
      render(() => (
        <Conditional
          if={obj}
          then={<div>then content</div>}
          else={<div>else content</div>}
        />
      ));

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(screen.getByText("else content")).toBeInTheDocument();
    });
  });

  describe("reactivity", () => {
    it("switches from else to then when if becomes truthy", async () => {
      const [condition, setCondition] = createSignal<boolean>(false);

      render(() => (
        <Conditional
          if={condition()}
          then={<div>then content</div>}
          else={<div>else content</div>}
        />
      ));

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(screen.getByText("else content")).toBeInTheDocument();

      setCondition(true);

      expect(screen.getByText("then content")).toBeInTheDocument();
      expect(screen.queryByText("else content")).not.toBeInTheDocument();
    });

    it("switches from then to else when if becomes falsy", async () => {
      const [condition, setCondition] = createSignal<boolean>(true);

      render(() => (
        <Conditional
          if={condition()}
          then={<div>then content</div>}
          else={<div>else content</div>}
        />
      ));

      expect(screen.getByText("then content")).toBeInTheDocument();

      setCondition(false);

      expect(screen.queryByText("then content")).not.toBeInTheDocument();
      expect(screen.getByText("else content")).toBeInTheDocument();
    });

    it("then JSXElement updates reactively when inner signal changes", async () => {
      const [label, setLabel] = createSignal("initial");

      render(() => <Conditional if={true} then={<div>{label()}</div>} />);

      expect(screen.getByText("initial")).toBeInTheDocument();

      setLabel("updated");

      expect(screen.getByText("updated")).toBeInTheDocument();
    });

    it("then JSXElement updates reactively when if changes from a signal", async () => {
      const [data, setData] = createSignal<string | undefined>(undefined);

      render(() => (
        <Conditional
          if={data()}
          then={<div data-testid="content">{data()}</div>}
          else={<div>no data</div>}
        />
      ));

      expect(screen.getByText("no data")).toBeInTheDocument();
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();

      setData("resolved");

      expect(screen.getByTestId("content")).toHaveTextContent("resolved");
      expect(screen.queryByText("no data")).not.toBeInTheDocument();
    });

    it("then function value accessor tracks reactive if", () => {
      const [data, setData] = createSignal<{ name: string } | null>(null);

      render(() => (
        <Conditional
          if={data()}
          then={(value) => <div data-testid="content">{value().name}</div>}
          else={<div>no data</div>}
        />
      ));

      expect(screen.getByText("no data")).toBeInTheDocument();

      setData({ name: "Alice" });

      expect(screen.getByTestId("content")).toHaveTextContent("Alice");

      setData({ name: "Bob" });

      expect(screen.getByTestId("content")).toHaveTextContent("Bob");
    });
  });
});
