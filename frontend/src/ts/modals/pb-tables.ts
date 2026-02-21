import * as DB from "../db";
import { format } from "date-fns/format";
import { getLanguageDisplayString } from "../utils/strings";
import Config from "../config";
import Format from "../utils/format";
import AnimatedModal from "../utils/animated-modal";
import { Mode, Mode2, PersonalBest } from "@monkeytype/schemas/shared";

type PBWithMode2 = {
  mode2: Mode2<Mode>;
} & PersonalBest;

function update(mode: Mode): void {
  const modalEl = modal.getModal();

  modalEl.qs("table tbody")?.empty();
  modalEl.qs("thead td:first-child")?.setText(mode);
  modalEl.qs("thead span.unit")?.setText(Config.typingSpeedUnit);

  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const allmode2 = snapshot.personalBests?.[mode] as
    | Record<string, PBWithMode2[]>
    | undefined;

  if (allmode2 === undefined) return;

  const list: PBWithMode2[] = [];
  Object.keys(allmode2).forEach(function (key) {
    let pbs = allmode2[key] ?? [];
    pbs = pbs.sort(function (a, b) {
      return b.wpm - a.wpm;
    });
    pbs.forEach(function (pb) {
      pb.mode2 = key;
      list.push(pb);
    });
  });

  let mode2memory: Mode2<Mode>;

  list.forEach((pb) => {
    let dateText = `-<br><span class="sub">-</span>`;
    const date = new Date(pb.timestamp);
    if (pb.timestamp) {
      dateText =
        format(date, "dd MMM yyyy") +
        "<br><div class='sub'>" +
        format(date, "HH:mm") +
        "</div>";
    }
    modalEl.qs("table tbody")?.appendHtml(
      `
      <tr>
        <td>${mode2memory === pb.mode2 ? "" : pb.mode2}</td>
        <td>
          ${Format.typingSpeed(pb.wpm)}
          <br />
          <span class="sub">${Format.accuracy(pb.acc)}</span>
        </td>
        <td>
          ${Format.typingSpeed(pb.raw)}
          <br />
          <span class="sub">${Format.percentage(pb.consistency)}</span>
        </td>
        <td>${pb.difficulty}</td>
        <td>${pb.language ? getLanguageDisplayString(pb.language) : "-"}</td>
        <td>${pb.punctuation ? '<i class="fas fa-check"></i>' : ""}</td>
        <td>${pb.numbers ? '<i class="fas fa-check"></i>' : ""}</td>
        <td>${pb.lazyMode ? '<i class="fas fa-check"></i>' : ""}</td>
        <td>${dateText}</td>
      </tr>
    `,
    );
    mode2memory = pb.mode2;
  });
}

export function show(mode: Mode): void {
  void modal.show({
    beforeAnimation: async () => {
      update(mode);
    },
  });
}

const modal = new AnimatedModal({
  dialogId: "pbTablesModal",
});
