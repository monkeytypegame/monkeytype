import format from "date-fns/format";
import { getReleasesFromGitHub, isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "versionHistoryWrapper";

function show(): void {
  Skeleton.append(wrapperId);
  $("#versionHistory").html(`
    <div class="preloader">
      <i class="fas fa-fw fa-spin fa-circle-notch"></i>
    </div
  `);
  getReleasesFromGitHub().then((releases) => {
    $("#versionHistory").html(`<div class="releases"></div`);
    releases.forEach((release: MonkeyTypes.GithubRelease) => {
      if (!release.draft && !release.prerelease) {
        let body = release.body;

        body = body.replace(/\r\n/g, "<br>");
        //replace ### title with h3 title h3
        body = body.replace(/### (.*?)<br>/g, "<h3>$1</h3>");
        body = body.replace(/<\/h3><br>/gi, "</h3>");
        //remove - at the start of a line
        body = body.replace(/^- /gm, "");
        //replace **bold** with bold
        body = body.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        //replace links with a tags
        body = body.replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" target="_blank">$1</a>'
        );

        $("#versionHistory .releases").append(`
        <div class="release">
          <div class="title">${release.name}</div>
          <div class="date">${format(
            new Date(release.published_at),
            "dd MMM yyyy"
          )}</div>
          <div class="body">${body}</div>
        </div>
      `);
      }
    });
  });
  $("#versionHistoryWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
  $("#newVersionIndicator").addClass("hidden");
}

function hide(): void {
  $("#versionHistoryWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#versionHistoryWrapper").addClass("hidden");
      $("#versionHistory").html("");
      Skeleton.remove(wrapperId);
    });
}

$("footer").on("click", "#newVersionIndicator", () => {
  $("#newVersionIndicator").addClass("hidden");
});

$("footer").on("click", "button.currentVersion", (e) => {
  if (e.shiftKey) return;
  show();
});

$("#popups").on("click", "#versionHistoryWrapper", (e) => {
  if ($(e.target).attr("id") === "versionHistoryWrapper") {
    hide();
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
