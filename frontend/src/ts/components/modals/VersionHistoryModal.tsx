import { useQuery } from "@tanstack/solid-query";
import { For, JSXElement } from "solid-js";

import { getVersionHistoryQueryOptions } from "../../queries/public";
import { isModalOpen } from "../../stores/modals";
import { AnimatedModal } from "../common/AnimatedModal";
import AsyncContent from "../common/AsyncContent";

export function VersionHistoryModal(): JSXElement {
  const isOpen = (): boolean => isModalOpen("VersionHistory");

  const releases = useQuery(() => ({
    ...getVersionHistoryQueryOptions(),
    enabled: isOpen(),
  }));

  return (
    <AnimatedModal id="VersionHistory" modalClass="max-w-6xl">
      <AsyncContent
        query={releases}
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
        <div class="text-4xl text-main">{props.name}</div>
        <div class="text-sub">{props.publishedAt}</div>
      </div>
      {/* oxlint-disable-next-line solid/no-innerhtml */}
      <div innerHTML={props.bodyHTML}></div>
      <div class="mt-4 mb-16 h-1 w-full rounded bg-sub-alt"></div>
    </div>
  );
}
