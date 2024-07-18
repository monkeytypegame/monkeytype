import * as DB from "../db";
import { format } from "date-fns/format";
import { getLanguageDisplayString } from "../utils/strings";
import Config from "../config";
import Format from "../utils/format";
import AnimatedModal from "../utils/animated-modal";

type PersonalBest = {
  mode2: SharedTypes.Config.Mode2<SharedTypes.Config.Mode>;
} & SharedTypes.PersonalBest;

function update(mode: SharedTypes.Config.Mode): void {
  const modalEl = modal.getModal();

  (modalEl.querySelector("table tbody") as HTMLElement).innerHTML = "";
  (modalEl.querySelector("table thead tr td") as HTMLElement).textContent =
    mode;
  (
    modalEl.querySelector("table thead tr td span.unit") as HTMLElement
  ).textContent = Config.typingSpeedUnit;

  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const allmode2 = snapshot.personalBests?.[mode] as
    | Record<string, PersonalBest[]>
    | undefined;

  if (allmode2 === undefined) return;

  const list: PersonalBest[] = [];
  (
    Object.keys(allmode2) as SharedTypes.Config.Mode2<SharedTypes.Config.Mode>[]
  ).forEach(function (key) {
    let pbs = allmode2[key] ?? [];
    pbs = pbs.sort(function (a, b) {
      return b.wpm - a.wpm;
    });
    pbs.forEach(function (pb) {
      pb.mode2 = key;
      list.push(pb);
    });
  });

  let mode2memory: SharedTypes.Config.Mode2<SharedTypes.Config.Mode>;

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
    modalEl.querySelector("table tbody")?.insertAdjacentHTML(
      `beforeend`,
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
    `
    );
    mode2memory = pb.mode2;
  });
}

export function show(mode: SharedTypes.Config.Mode): void {
  void modal.show({
    beforeAnimation: async () => {
      update(mode);
    },
  });
}

const modal = new AnimatedModal({
  dialogId: "pbTablesModal",
});
