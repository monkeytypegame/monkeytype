import { format as formatDate } from "date-fns/format";
import {
  type Mode,
  type Mode2,
  type PersonalBest,
} from "@monkeytype/schemas/shared";
import { createMemo, createSignal, For, JSXElement, Show } from "solid-js";

import * as DB from "../../db";
import { getConfig } from "../../config/store";
import { pbTablesMode } from "../../states/pb-tables-modal";
import { getLanguageDisplayString } from "../../utils/strings";
import { Formatting } from "../../utils/format";
import { AnimatedModal } from "../common/AnimatedModal";
import { Fa } from "../common/Fa";

type PBWithMode2 = PersonalBest & {
  mode2: Mode2<Mode>;
};

type PBRow = {
  rowClass: "odd" | "even";
  pb: PBWithMode2;
};

type PBGroup = {
  mode2: Mode2<Mode>;
  rows: PBRow[];
};

function buildGroups(mode: Mode): PBGroup[] {
  const snapshot = DB.getSnapshot();
  if (snapshot === undefined) return [];

  const allMode2 = snapshot.personalBests?.[mode] as
    | Record<string, PBWithMode2[]>
    | undefined;
  if (allMode2 === undefined) return [];

  const list: PBWithMode2[] = [];
  Object.keys(allMode2).forEach((key) => {
    const pbs = [...(allMode2[key] ?? [])].sort((a, b) => b.wpm - a.wpm);
    pbs.forEach((pb) => {
      list.push({
        ...pb,
        mode2: key as Mode2<Mode>,
      });
    });
  });

  const groups: PBGroup[] = [];
  let currentGroup: PBGroup | undefined;

  list.forEach((pb, index) => {
    if (currentGroup?.mode2 !== pb.mode2) {
      currentGroup = {
        mode2: pb.mode2,
        rows: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.rows.push({
      pb,
      rowClass: index % 2 === 0 ? "odd" : "even",
    });
  });

  return groups;
}

export function PbTablesModal(): JSXElement {
  const [groups, setGroups] = createSignal<PBGroup[]>([]);
  const format = createMemo(() => new Formatting(getConfig));
  const mode = createMemo(() => pbTablesMode());

  return (
    <AnimatedModal
      id="PbTables"
      modalClass="max-w-full gap-0 overflow-y-scroll p-8"
      beforeShow={() => {
        setGroups(buildGroups(mode()));
      }}
    >
      <table class="border-collapse border-spacing-0 text-text">
        <thead class="sticky -top-8 z-3 bg-bg text-xs text-sub">
          <tr>
            <td class="px-2 py-2" width="1%">
              {mode()}
            </td>
            <td class="px-2 py-2 text-right">
              <span>{format().typingSpeedUnit}</span>
              <br />
              <span class="opacity-50">accuracy</span>
            </td>
            <td class="px-2 py-2 text-right">
              raw
              <br />
              <span class="opacity-50">consistency</span>
            </td>
            <td class="px-2 py-2 text-right">difficulty</td>
            <td class="px-2 py-2 text-right">language</td>
            <td class="px-2 py-2 text-center">punctuation</td>
            <td class="px-2 py-2 text-center">numbers</td>
            <td class="px-2 py-2 text-right">lazy mode</td>
            <td class="px-2 py-2 text-right">date</td>
          </tr>
        </thead>
        <For each={groups()}>
          {(group) => (
            <tbody class="[clip-path:inset(0)]">
              <For each={group.rows}>
                {(row, index) => {
                  const date = () =>
                    row.pb.timestamp ? new Date(row.pb.timestamp) : undefined;
                  const rowBackground =
                    row.rowClass === "odd" ? "bg-sub-alt" : "bg-bg";

                  return (
                    <tr class={rowBackground}>
                      <Show
                        when={index() === 0}
                        fallback={<td class="px-2 py-2 text-right"></td>}
                      >
                        <td
                          class={`${rowBackground} sticky top-[calc(1rem-2px)] z-2 px-2 py-2 text-right text-2xl`}
                        >
                          {group.mode2}
                        </td>
                      </Show>
                      <td class="px-2 py-2 text-right">
                        {format().typingSpeed(row.pb.wpm)}
                        <br />
                        <span class="opacity-50">
                          {format().accuracy(row.pb.acc)}
                        </span>
                      </td>
                      <td class="px-2 py-2 text-right">
                        {format().typingSpeed(row.pb.raw)}
                        <br />
                        <span class="opacity-50">
                          {format().percentage(row.pb.consistency)}
                        </span>
                      </td>
                      <td class="px-2 py-2 text-right">{row.pb.difficulty}</td>
                      <td class="px-2 py-2 text-right">
                        {row.pb.language
                          ? getLanguageDisplayString(row.pb.language)
                          : "-"}
                      </td>
                      <td class="px-2 py-2 text-center">
                        <Show when={row.pb.punctuation}>
                          <Fa icon="fa-check" />
                        </Show>
                      </td>
                      <td class="px-2 py-2 text-center">
                        <Show when={row.pb.numbers}>
                          <Fa icon="fa-check" />
                        </Show>
                      </td>
                      <td class="px-2 py-2 text-right">
                        <Show when={row.pb.lazyMode}>
                          <Fa icon="fa-check" />
                        </Show>
                      </td>
                      <td class="px-2 py-2 text-right">
                        <Show
                          when={date() !== undefined}
                          fallback={
                            <>
                              -
                              <br />
                              <span class="opacity-50">-</span>
                            </>
                          }
                        >
                          <Show when={date()}>
                            {(safeDate) => (
                              <>
                                {formatDate(safeDate(), "dd MMM yyyy")}
                                <br />
                                <div class="opacity-50">
                                  {formatDate(safeDate(), "HH:mm")}
                                </div>
                              </>
                            )}
                          </Show>
                        </Show>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          )}
        </For>
      </table>
    </AnimatedModal>
  );
}
