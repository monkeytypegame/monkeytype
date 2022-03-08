import * as DB from "../db";

interface PersonalBest extends MonkeyTypes.PersonalBest {
  mode2: MonkeyTypes.Mode2<MonkeyTypes.Mode>;
}

function update(mode: MonkeyTypes.Mode): void {
  $("#pbTablesPopup table tbody").empty();
  $($("#pbTablesPopup table thead tr td")[0]).text(mode);

  const snapshot = DB.getSnapshot();

  const allmode2 = (
    snapshot.personalBests === undefined
      ? undefined
      : snapshot.personalBests[mode]
  ) as { [quote: string]: PersonalBest[] } | undefined;

  if (allmode2 === undefined) return;

  const list: PersonalBest[] = [];
  (Object.keys(allmode2) as MonkeyTypes.Mode2<MonkeyTypes.Mode>[]).forEach(
    function (key) {
      let pbs = allmode2[key];
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
    }
  );

  let mode2memory: MonkeyTypes.Mode2<MonkeyTypes.Mode>;

  list.forEach((pb) => {
    let dateText = `-<br><span class="sub">-</span>`;
    if (pb.timestamp) {
      dateText =
        moment(pb.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pb.timestamp).format("HH:mm") +
        "</div>";
    }
    $("#pbTablesPopup table tbody").append(`
      <tr>
        <td>${mode2memory === pb.mode2 ? "" : pb.mode2}</td>
        <td>
          ${pb.wpm}
          <br />
          <span class="sub">${pb.acc ? pb.acc + "%" : "-"}</span>
        </td>
        <td>
          ${pb.raw ? pb.raw : "-"}
          <br />
          <span class="sub">${
            pb.consistency ? pb.consistency + "%" : "-"
          }</span>
        </td>
        <td>${pb.difficulty}</td>
        <td>${pb.language ? pb.language.replace(/_/g, " ") : "-"}</td>
        <td>${pb.punctuation ? '<i class="fas fa-check"></i>' : ""}</td>
        <td>${pb.lazyMode ? '<i class="fas fa-check"></i>' : ""}</td>
        <td>${dateText}</td>
      </tr>
    `);
    mode2memory = pb.mode2 as never;
  });
}

function show(mode: MonkeyTypes.Mode): void {
  if ($("#pbTablesPopupWrapper").hasClass("hidden")) {
    update(mode);

    $("#pbTablesPopup .title").text(`All ${mode} personal bests`);

    $("#pbTablesPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100);
  }
}

function hide(): void {
  if (!$("#pbTablesPopupWrapper").hasClass("hidden")) {
    $("#pbTablesPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#pbTablesPopupWrapper").addClass("hidden");
          $("#pbTablesPopup table tbody").empty();
        }
      );
  }
}

$("#pbTablesPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "pbTablesPopupWrapper") {
    hide();
  }
});

$(".pageAccount .button.showAllTimePbs").on("click", () => {
  show("time");
});

$(".pageAccount .button.showAllWordsPbs").on("click", () => {
  show("words");
});
