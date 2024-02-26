import * as DB from "../db";
import format from "date-fns/format";
import * as Skeleton from "./skeleton";
import { getLanguageDisplayString, isPopupVisible } from "../utils/misc";
import Config from "../config";
import Format from "../utils/format";

type PersonalBest = {
  mode2: SharedTypes.Config.Mode2<SharedTypes.Config.Mode>;
} & SharedTypes.PersonalBest;

const wrapperId = "pbTablesPopupWrapper";

function update(mode: SharedTypes.Config.Mode): void {
  $("#pbTablesPopup table tbody").empty();
  $($("#pbTablesPopup table thead tr td")[0] as HTMLElement).text(mode);
  $($("#pbTablesPopup table thead tr td span.unit")[0] as HTMLElement).text(
    Config.typingSpeedUnit
  );

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
      // if (a.difficulty === b.difficulty) {
      //   return (a.language < b.language ? -1 : 1);
      // }
      // return (a.difficulty < b.difficulty ? -1 : 1)
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
    $("#pbTablesPopup table tbody").append(`
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
    `);
    mode2memory = pb.mode2;
  });
}

function show(mode: SharedTypes.Config.Mode): void {
  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    update(mode);

    $("#pbTablesPopup .title").text(`All ${mode} personal bests`);

    $("#pbTablesPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $("#pbTablesPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#pbTablesPopupWrapper").addClass("hidden");
          $("#pbTablesPopup table tbody").empty();
          Skeleton.remove(wrapperId);
        }
      );
  }
}

$("#pbTablesPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "pbTablesPopupWrapper") {
    hide();
  }
});

$(".pageAccount .profile").on("click", ".pbsTime .showAllButton", () => {
  show("time");
});

$(".pageAccount .profile").on("click", ".pbsWords .showAllButton", () => {
  show("words");
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
