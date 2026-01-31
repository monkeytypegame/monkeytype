import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { DataTable } from "../../../../src/ts/components/ui/table/DataTable";

const [localStorage, setLocalStorage] = createSignal([]);
vi.mock("../../../../src/ts/hooks/useLocalStorage", () => {
  return {
    useLocalStorage: () => {
      return [localStorage, setLocalStorage] as const;
    },
  };
});

const bpSignal = createSignal({
  xxs: true,
  sm: true,
  md: true,
});

vi.mock("../../../../src/ts/signals/breakpoints", () => ({
  bp: () => bpSignal[0](),
}));

type Person = {
  name: string;
  age: number;
};

const columns = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => info.getValue(),
    meta: { breakpoint: "xxs" },
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: (info: any) => info.getValue(),
    meta: { breakpoint: "sm" },
  },
];

const data: Person[] = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 20 },
];

describe("DataTable", () => {
  beforeEach(() => {
    bpSignal[1]({
      xxs: true,
      sm: true,
      md: true,
    });
  });

  it("renders table headers and rows", () => {
    render(() => <DataTable id="people" columns={columns} data={data} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders fallback when there is no data", () => {
    render(() => (
      <DataTable
        id="empty"
        columns={columns}
        data={[]}
        fallback={<div>No data</div>}
      />
    ));

    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("sorts rows when clicking a sortable header", async () => {
    render(() => <DataTable id="sorting" columns={columns} data={data} />);

    const ageHeaderButton = screen.getByRole("button", { name: "Age" });
    const ageHeaderCell = ageHeaderButton.closest("th");

    // Initial
    expect(ageHeaderCell).toHaveAttribute("aria-sort", "none");
    expect(ageHeaderCell?.querySelector("i")).toHaveClass("fa-fw");

    // Descending
    await fireEvent.click(ageHeaderButton);
    expect(ageHeaderCell).toHaveAttribute("aria-sort", "descending");
    expect(ageHeaderCell?.querySelector("i")).toHaveClass(
      "fa-sort-down",
      "fas",
      "fa-fw",
    );
    expect(localStorage()).toEqual([
      {
        desc: true,
        id: "age",
      },
    ]);

    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alice"); // age 30
    expect(rows[2]).toHaveTextContent("Bob"); // age 20

    // Ascending
    await fireEvent.click(ageHeaderButton);
    expect(ageHeaderCell).toHaveAttribute("aria-sort", "ascending");
    expect(ageHeaderCell?.querySelector("i")).toHaveClass(
      "fa-sort-up",
      "fas",
      "fa-fw",
    );
    expect(localStorage()).toEqual([
      {
        desc: false,
        id: "age",
      },
    ]);

    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Bob");
    expect(rows[2]).toHaveTextContent("Alice");

    //back to initial
    await fireEvent.click(ageHeaderButton);
    expect(ageHeaderCell).toHaveAttribute("aria-sort", "none");
    expect(localStorage()).toEqual([]);
  });

  it("hides columns based on breakpoint visibility", () => {
    bpSignal[1]({
      xxs: true,
      sm: false,
      md: false,
    });

    render(() => <DataTable id="breakpoints" columns={columns} data={data} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByText("Age")).not.toBeInTheDocument();
  });
});
