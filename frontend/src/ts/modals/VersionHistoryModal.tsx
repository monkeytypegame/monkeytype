import { JSXElement, createSignal, createResource, Show, For } from "solid-js";
import { format } from "date-fns/format";
import { getReleasesFromGitHub } from "../utils/json-data";
import { createErrorMessage } from "../utils/misc";
import { AnimatedModal } from "../components/AnimatedModal";
import "./VersionHistoryModal.scss";

const [isOpen, setIsOpen] = createSignal(false);

export function show(): void {
  setIsOpen(true);
}

export function VersionHistoryModal(): JSXElement {
  const [releases] = createResource(isOpen, async (open) => {
    if (!open) return null;
    const releases = await getReleasesFromGitHub();
    const data = [];
    for (const release of releases) {
      if (release.draft || release.prerelease) continue;

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
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      );

      data.push({
        name: release.name,
        publishedAt: format(new Date(release.published_at), "dd MMM yyyy"),
        body,
      });
    }
    return data;
  });

  return (
    <AnimatedModal
      id="versionHistoryModal"
      isOpen={isOpen()}
      onClose={() => setIsOpen(false)}
      class="VersionHistoryModal"
    >
      <Show
        when={!releases.loading && releases.error === undefined}
        fallback={
          <Show
            when={releases.loading}
            fallback={
              <div class="releases error">
                {createErrorMessage(
                  releases.error,
                  "Failed to fetch version history",
                )}
              </div>
            }
          >
            <div class="preloader">
              <i class="fas fa-fw fa-spin fa-circle-notch"></i>
            </div>
          </Show>
        }
      >
        <div class="releases">
          <For each={releases()}>
            {(release) => {
              const setBodyHTML = (el: HTMLDivElement): void => {
                el.innerHTML = release.body;
              };

              return (
                <div class="release">
                  <div class="title">{release.name}</div>
                  <div class="date">{release.publishedAt}</div>
                  <div class="body" ref={setBodyHTML} />
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </AnimatedModal>
  );
}
