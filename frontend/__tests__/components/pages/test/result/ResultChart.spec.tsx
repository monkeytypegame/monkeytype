// static json (layouts...) read from disk, the test state module loads some
import "../../../../__harness__/mock-static";
import { render } from "@solidjs/testing-library";
import { Suspense } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

// tags() suspends until the tags load (never, here), tags.state fills in when they do
const tagNames = vi.hoisted(() => ({
  set: undefined as ((id: string, name: string) => void) | undefined,
}));
vi.mock("../../../../../src/ts/collections/tags", async () => {
  const { createResource } = await import("solid-js");
  const { createStore } = await import("solid-js/store");
  return {
    useTagsLiveQuery: () => {
      const [names, setNames] = createStore<Record<string, { name: string }>>(
        {},
      );
      tagNames.set = (id, name) => setNames(id, { name });
      const [pending] = createResource(
        async () => new Promise<never>(() => undefined),
      );
      return Object.assign(() => pending(), {
        state: { get: (id: string) => names[id] },
      });
    },
  };
});
vi.mock("../../../../../src/ts/db", () => ({
  getLocalPB: () => undefined,
}));
// no canvas in jsdom - show the pb line labels instead
vi.mock("../../../../../src/ts/components/common/ChartJs", () => ({
  ChartJs: (props: {
    options: {
      plugins: {
        annotation: { annotations: { label: { content: string } }[] };
      };
    };
  }) => (
    <div data-testid="chart">
      {props.options.plugins.annotation.annotations
        .map((a) => a.label.content)
        .join("|")}
    </div>
  ),
}));

import { ResultChart } from "../../../../../src/ts/components/pages/test/result/ResultChart";
import {
  setResultShown,
  setResultState,
} from "../../../../../src/ts/states/result";
import { CompletedResult } from "../../../../../src/ts/states/test";

describe("ResultChart", () => {
  afterEach(() => {
    setResultShown(false);
    setResultState("tags", []);
  });

  it("draws the chart before tags load, adds tag pb lines when they arrive", () => {
    setResultState("tags", [{ id: "tag1", isPb: false, chartPb: 100 }]);
    setResultShown(true);

    const { queryByTestId, getByTestId, queryByText } = render(() => (
      <Suspense fallback={<div>suspended</div>}>
        <ResultChart
          result={
            {
              mode: "time",
              mode2: "15",
              funbox: [],
              chartData: "toolong",
            } as unknown as CompletedResult
          }
          eventLog={[] as never}
        />
      </Suspense>
    ));

    expect(queryByText("suspended")).toBeNull();
    expect(queryByTestId("chart")).not.toBeNull();
    expect(getByTestId("chart")).not.toHaveTextContent("PB");

    tagNames.set?.("tag1", "speed");

    expect(getByTestId("chart")).toHaveTextContent("speed PB: 100.00");
  });
});
