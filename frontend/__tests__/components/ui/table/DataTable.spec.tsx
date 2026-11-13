import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  DataTable,
  DataTableColumnDef,
} from "../../../../src/ts/components/ui/table/DataTable";

const [localStorage, setLocalStorage] = createSignal<
  { id: string; desc: boolean }[]
>([]);
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

vi.mock("../../../../src/ts/states/breakpoints", () => ({
  bp: () => bpSignal[0](),
}));

type Person = {
  name: string;
  age: number;
};

const columns = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    // oxlint-disable-next-line typescript/no-unsafe-return typescript/no-unsafe-call
    cell: (info: any) => info.getValue(),
    meta: { maxBreakpoint: "sm" },
  },
  {
    id: "age",
    accessorKey: "age",
    header: "Age",
    // oxlint-disable-next-line typescript/no-unsafe-return typescript/no-unsafe-call
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
    setLocalStorage([]);
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
    fireEvent.click(ageHeaderButton);
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
    fireEvent.click(ageHeaderButton);
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
    fireEvent.click(ageHeaderButton);
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
    const nameHeader = screen.getByRole("button", {
      name: "Name",
    }).parentElement;
    const ageHeader = screen.getByRole("button", { name: "Age" }).parentElement;

    expect(nameHeader).not.toHaveClass("hidden");
    expect(nameHeader).toHaveClass("sm:hidden");
    expect(ageHeader).toHaveClass("hidden sm:table-cell");
  });

  it("updates rows when data changes", async () => {
    const [rows, setRows] = createSignal<Person[]>(data);
    render(() => (
      <DataTable id="reactiveData" columns={columns} data={rows()} />
    ));

    expect(screen.getAllByRole("row")).toHaveLength(3);
    setRows([{ name: "Carol", age: 40 }]);

    expect(await screen.findByText("Carol")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("updates headers when columns change", async () => {
    const [cols, setCols] = createSignal<DataTableColumnDef<Person>[]>(columns);
    render(() => <DataTable id="reactiveCols" columns={cols()} data={data} />);

    expect(screen.getByRole("button", { name: "Age" })).toBeInTheDocument();

    setCols([
      {
        id: "age",
        accessorKey: "age",
        header: "Years",
        // oxlint-disable-next-line typescript/no-unsafe-return typescript/no-unsafe-call
        cell: (info: any) => info.getValue(),
      },
    ]);

    expect(
      await screen.findByRole("button", { name: "Years" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Age" })).toBeNull();
  });

  it("applies persisted sorting from the initial render", () => {
    setLocalStorage([{ id: "age", desc: false }]);

    render(() => (
      <DataTable id="persistedSort" columns={columns} data={data} />
    ));

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Bob"); // asc: age 20 first
    expect(rows[2]).toHaveTextContent("Alice");
  });

  it("reports sorting without reordering rows in manual mode", async () => {
    const onSortingChange = vi.fn();
    render(() => (
      <DataTable
        id="manualSort"
        columns={columns}
        data={data}
        onSortingChange={onSortingChange}
      />
    ));

    fireEvent.click(screen.getByRole("button", { name: "Age" }));

    expect(onSortingChange).toHaveBeenCalledWith([{ id: "age", desc: true }]);
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alice"); // data order untouched
    expect(rows[2]).toHaveTextContent("Bob");
  });

  it("marks the active row for rowSelection", () => {
    const activeRow = (): string | null => "Bob";
    render(() => (
      <DataTable
        id="selection"
        columns={columns}
        data={data}
        rowSelection={{
          getRowId: (row) => row.name,
          activeRow,
          class: "row-selected",
        }}
      />
    ));

    const bob = screen.getByText("Bob").closest("tr");
    expect(bob).toHaveAttribute("data-state", "selected");
    expect(bob).toHaveClass("row-selected");
    expect(screen.getByText("Alice").closest("tr")).not.toHaveAttribute(
      "data-state",
    );
  });
});
