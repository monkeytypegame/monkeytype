import { format } from "date-fns/format";
import { getReleasesFromGitHub } from "../utils/json-data";
import AnimatedModal from "../utils/animated-modal";
import { createErrorMessage } from "../utils/misc";
import { qsr } from "../utils/dom";

export function show(): void {
  void modal.show({
    beforeAnimation: async () => {
      qsr("#versionHistoryModal .modal").setHtml(`
    <div class="preloader">
      <i class="fas fa-fw fa-spin fa-circle-notch"></i>
    </div
  `);
      getReleasesFromGitHub()
        .then((releases) => {
          qsr("#versionHistoryModal .modal").setHtml(
            `<div class="releases"></div`,
          );
          releases.forEach((release) => {
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
                '<a href="$2" target="_blank">$1</a>',
              );

              qsr("#versionHistoryModal .modal .releases").appendHtml(`
        <div class="release">
          <div class="title">${release.name}</div>
          <div class="date">${format(
            new Date(release.published_at),
            "dd MMM yyyy",
          )}</div>
          <div class="body">${body}</div>
        </div>
      `);
            }
          });
        })
        .catch((e: unknown) => {
          const msg = createErrorMessage(e, "Failed to fetch version history");
          qsr("#versionHistoryModal .modal").setHtml(
            `<div class="releases">${msg}</div`,
          );
        });
      qsr("#newVersionIndicator").addClass("hidden");
    },
  });
}

const modal = new AnimatedModal({
  dialogId: "versionHistoryModal",
});
