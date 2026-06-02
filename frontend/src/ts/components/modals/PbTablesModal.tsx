import { Mode2, Mode, PersonalBest } from "@monkeytype/schemas/shared";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as formatDate } from "date-fns/format";
import { createMemo, JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import * as DB from "../../db";
import { pbTablesMode } from "../../states/pb-tables-modal";
import { cn } from "../../utils/cn";
import { Formatting } from "../../utils/format";
import { getLanguageDisplayString } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Fa } from "../common/Fa";
import { DataTable, DataTableColumnDef } from "../ui/table/DataTable";
import { MOCK_PERSONAL_BESTS, USE_MOCK_PB_DATA } from "./PbTablesModal.mock";

type PBWithMode2 = PersonalBest & {
  mode2: Mode2<Mode>;
};

type PBRow = PBWithMode2 & {
  isGroupStart: boolean;
};

function buildRows(mode: Mode): PBRow[] {
  const allmode2 = (
    USE_MOCK_PB_DATA
      ? MOCK_PERSONAL_BESTS[mode as "time" | "words"]
      : DB.getSnapshot()?.personalBests?.[mode]
  ) as Record<string, PBWithMode2[]> | undefined;
  if (allmode2 === undefined) return [];

  const list: PBWithMode2[] = [];
  Object.keys(allmode2).forEach((key) => {
    let pbs = allmode2[key] ?? [];
    pbs = [...pbs].sort((a, b) => b.wpm - a.wpm);
    pbs.forEach((pb) => {
      pb.mode2 = key;
      list.push(pb);
    });
  });

  const rows: PBRow[] = [];
  let currentMode2: string | undefined;

  list.forEach((pb) => {
    const isGroupStart = currentMode2 !== pb.mode2;
    currentMode2 = pb.mode2;
    rows.push({ ...pb, isGroupStart });
  });

  return rows;
}

function getColumns(options: {
  format: Formatting;
  mode: Mode;
}): DataTableColumnDef<PBRow>[] {
  const defineColumn = createColumnHelper<PBRow>().accessor;
  const { format: f, mode: m } = options;

  return [
    defineColumn("mode2", {
      enableSorting: false,
      header: () => m,
      cell: (info) => info.getValue(),
      meta: {
        align: "right",
        cellMeta: (info) => ({
          class: cn(
            "text-xl font-light text-text/40",
            info.row.isGroupStart && "font-normal text-text",
          ),
        }),
      },
    }),
    defineColumn("wpm", {
      enableSorting: false,
      header: () => (
        <>
          {f.typingSpeedUnit}
          <br />
          <span class="opacity-50">accuracy</span>
        </>
      ),
      cell: (info) => (
        <>
          {f.typingSpeed(info.getValue())}
          <br />
          <span class="opacity-50">{f.accuracy(info.row.original.acc)}</span>
        </>
      ),
      meta: { align: "right" },
    }),
    defineColumn("raw", {
      enableSorting: false,
      header: () => (
        <>
          raw
          <br />
          <span class="opacity-50">consistency</span>
        </>
      ),
      cell: (info) => (
        <>
          {f.typingSpeed(info.getValue())}
          <br />
          <span class="opacity-50">
            {f.percentage(info.row.original.consistency)}
          </span>
        </>
      ),
      meta: { align: "right" },
    }),
    defineColumn("difficulty", {
      enableSorting: false,
      header: () => "difficulty",
      cell: (info) => info.getValue(),
      meta: { align: "right" },
    }),
    defineColumn("language", {
      enableSorting: false,
      header: () => "language",
      cell: (info) => {
        const lang = info.getValue();
        return lang ? getLanguageDisplayString(lang) : "-";
      },
      meta: { align: "right" },
    }),
    defineColumn("punctuation", {
      enableSorting: false,
      header: () => "punctuation",
      cell: (info) => (info.getValue() ? <Fa icon="fa-check" /> : null),
      meta: { align: "center" },
    }),
    defineColumn("numbers", {
      enableSorting: false,
      header: () => "numbers",
      cell: (info) => (info.getValue() ? <Fa icon="fa-check" /> : null),
      meta: { align: "center" },
    }),
    defineColumn("lazyMode", {
      enableSorting: false,
      header: () => "lazy mode",
      cell: (info) => (info.getValue() ? <Fa icon="fa-check" /> : null),
      meta: { align: "center" },
    }),
    defineColumn("timestamp", {
      enableSorting: false,
      header: () => "date",
      cell: (info) => {
        const ts = info.getValue();
        return (
          <Show
            when={ts}
            fallback={
              <>
                -<br />
                <span class="opacity-50">-</span>
              </>
            }
          >
            {formatDate(ts, "dd MMM yyyy")}
            <br />
            <div class="opacity-50">{formatDate(ts, "HH:mm")}</div>
          </Show>
        );
      },
      meta: { align: "right" },
    }),
  ];
}

export function PbTablesModal(): JSXElement {
  const mode = createMemo(() => pbTablesMode());
  const rows = createMemo(() => buildRows(mode()));
  const columns = createMemo(() =>
    getColumns({ format: new Formatting(getConfig), mode: mode() }),
  );

  return (
    <AnimatedModal id="PbTables" modalClass="max-w-full gap-0 p-8">
      <DataTable
        id="pbTables"
        columns={columns()}
        data={rows()}
        class="[&>thead]:sticky [&>thead]:-top-8 [&>thead]:z-3 [&>thead]:bg-bg [&>thead]:text-xs"
      />
    </AnimatedModal>
  );
}
