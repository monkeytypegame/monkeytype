import { format } from "date-fns/format";
import { JSXElement, createResource, For } from "solid-js";

import { isModalOpen } from "../../stores/modals";
import { getReleasesFromGitHub } from "../../utils/json-data";
import { AnimatedModal } from "../common/AnimatedModal";
import AsyncContent from "../common/AsyncContent";

export function VersionHistoryModal(): JSXElement {
  const isOpen = (): boolean => isModalOpen("VersionHistory");
  const [releases] = createResource(isOpen, async (open) => {
    if (!open) return null;
    const releases = await getReleasesFromGitHub();
    const data = [];
    for (const release of releases) {
      if (release.draft || release.prerelease) continue;

      let body = release.body;

      body = body.replace(/\r\n/g, "<br>");
      //replace ### title with h3 title h3
      body = body.replace(
        /### (.*?)<br>/g,
        '<h3 class="text-sub mb-2 text-xl">$1</h3>',
      );
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
        bodyHTML: body,
      });
    }
    return data;
  });

  return (
    <AnimatedModal id="VersionHistory" modalClass="max-w-6xl">
      <AsyncContent
        resource={releases}
        errorMessage="Failed to load version history"
      >
        {(data) => (
          <div class="releases">
            <For each={data}>{(release) => <ReleaseItem {...release} />}</For>
          </div>
        )}
      </AsyncContent>
    </AnimatedModal>
  );
}

function ReleaseItem(props: {
  name: string;
  publishedAt: string;
  bodyHTML: string;
}): JSXElement {
  return (
    <div class="grid gap-4">
      <div class="flex place-items-center justify-between">
        <div class="text-main text-4xl">{props.name}</div>
        <div class="text-sub">{props.publishedAt}</div>
      </div>
      {/* oxlint-disable-next-line solid/no-innerhtml */}
      <div innerHTML={props.bodyHTML}></div>
      <div class="bg-sub-alt mt-4 mb-16 h-1 w-full rounded"></div>
    </div>
  );
}
