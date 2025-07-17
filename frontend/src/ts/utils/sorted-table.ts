type Sort = { property: string; descending: boolean };

export class SortedTable<T> {
  private data: { source: T; element: HTMLTableRowElement }[];
  private table: JQuery<HTMLTableElement>;
  private sort?: Sort;

  constructor({
    table,
    data,
    buildRow,
    initialSort,
  }: {
    table: string;
    data: T[];
    buildRow: (entry: T) => HTMLTableRowElement;
    initialSort?: Sort;
  }) {
    this.table = $(table);
    if (this.table === undefined)
      throw new Error(`No element found for ${table}`);

    //render content
    this.data = data.map((source) => ({ source, element: buildRow(source) }));
    if (initialSort !== undefined) {
      this.sort = initialSort;
      this.doSort();
    }

    //init rows
    for (const col of this.table.find(`td[data-sort-property]`)) {
      col.classList.add("sortable");
      col.setAttribute("type", "button");
      col.onclick = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const property = target.dataset["sortProperty"] as string;
        if (property === undefined) return;

        if (this.sort === undefined || property !== this.sort.property) {
          this.sort = { property, descending: false };
        } else {
          this.sort.descending = !this.sort?.descending;
        }

        this.doSort();
        this.updateBody();
      };
    }

    //fill table body
    this.updateBody();
  }

  private doSort(): void {
    if (this.sort === undefined) return;

    const { property, descending } = this.sort;
    // Removes styling from previous sorting requests:
    this.table.find("thead td").removeClass("headerSorted");
    this.table.find("thead td").children("i").remove();
    this.table
      .find(`thead td[data-sort-property="${property}"]`)
      .addClass("headerSorted")
      .append(
        `<i class="fas ${
          descending ? "fa-sort-down" : "fa-sort-up"
        } aria-hidden="true"></i>`
      );

    this.data.sort((a, b) => {
      const valA = getValueByPath(a.source, property);
      const valB = getValueByPath(b.source, property);

      let result = 0;

      if (valA === undefined && valB !== undefined) {
        return descending ? 1 : -1;
      } else if (valA !== undefined && valB === undefined) {
        return descending ? -1 : 1;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        result = valA.localeCompare(valB);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        result = valA - valB;
      }

      return descending ? -result : result;
    });
  }
  private updateBody(): void {
    const body = this.table.find("tbody");
    body.empty();
    body.append(this.data.map((data) => data.element));
  }
}

function getValueByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc, key) => {
    // oxlint-disable-next-line no-explicit-any
    // @ts-expect-error this is fine
    return acc !== null && acc !== undefined ? acc[key] : undefined;
  }, obj);
}
