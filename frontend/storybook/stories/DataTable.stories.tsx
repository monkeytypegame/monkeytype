import preview from "#.storybook/preview";
import { Component, createSignal } from "solid-js";

import {
  DataTable,
  DataTableColumnDef,
} from "../../src/ts/components/ui/table/DataTable";

type Person = {
  name: string;
  age: number;
  email: string;
  role: string;
};

const sampleData: Person[] = [
  { name: "Alice", age: 28, email: "alice@example.com", role: "Engineer" },
  { name: "Bob", age: 34, email: "bob@example.com", role: "Designer" },
  { name: "Charlie", age: 22, email: "charlie@example.com", role: "Manager" },
  { name: "Diana", age: 31, email: "diana@example.com", role: "Engineer" },
  { name: "Eve", age: 27, email: "eve@example.com", role: "Designer" },
];

const columns: DataTableColumnDef<Person>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
  },
  {
    accessorKey: "age",
    header: "Age",
    enableSorting: true,
    meta: { align: "right" as const },
  },
  {
    accessorKey: "email",
    header: "Email",
    enableSorting: false,
  },
  {
    accessorKey: "role",
    header: "Role",
    enableSorting: true,
  },
];

const meta = preview.meta({
  title: "UI/DataTable",
  component: DataTable as Component,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => (
    <DataTable id="story-default" columns={columns} data={sampleData} />
  ),
});

export const WithRowSelection = meta.story({
  render: () => {
    const [activeRow, setActiveRow] = createSignal<string | null>(null);
    return (
      <div>
        <p style={{ color: "var(--sub-color)", "margin-bottom": "8px" }}>
          Click a row to select it. Active: {activeRow() ?? "none"}
        </p>
        <DataTable
          id="story-selection"
          columns={columns.map((col) => ({
            ...col,
            meta: {
              ...col.meta,
              cellMeta: () => ({
                style: "cursor: pointer",
                onClick: () => {
                  const key = (col as { accessorKey?: string }).accessorKey;
                  if (key === "name") return;
                },
              }),
            },
          }))}
          data={sampleData}
          rowSelection={{
            getRowId: (row) => row.name,
            class: "bg-main/10",
            activeRow,
          }}
        />
        <div style={{ display: "flex", gap: "4px", "margin-top": "8px" }}>
          {sampleData.map((p) => (
            <button
              style={{
                padding: "4px 8px",
                "background-color":
                  activeRow() === p.name
                    ? "var(--main-color)"
                    : "var(--sub-alt-color)",
                color:
                  activeRow() === p.name
                    ? "var(--bg-color)"
                    : "var(--text-color)",
                border: "none",
                "border-radius": "4px",
                cursor: "pointer",
              }}
              onClick={() =>
                setActiveRow((prev) => (prev === p.name ? null : p.name))
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  },
});

export const Empty = meta.story({
  render: () => <DataTable id="story-empty" columns={columns} data={[]} />,
});

export const EmptyWithNoDataRow = meta.story({
  render: () => (
    <DataTable id="story-nodata" columns={columns} data={[]} noDataRow />
  ),
});

export const EmptyWithCustomNoData = meta.story({
  render: () => (
    <DataTable
      id="story-custom-nodata"
      columns={columns}
      data={[]}
      noDataRow={{
        content: (
          <span style={{ color: "var(--error-color)" }}>
            No results found. Try a different search.
          </span>
        ),
      }}
    />
  ),
});

export const HiddenHeader = meta.story({
  render: () => (
    <DataTable
      id="story-no-header"
      columns={columns}
      data={sampleData}
      hideHeader
    />
  ),
});
