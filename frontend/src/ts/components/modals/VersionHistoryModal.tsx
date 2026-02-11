import { useInfiniteQuery } from "@tanstack/solid-query";
import { For, JSXElement } from "solid-js";

import { getVersionHistoryQueryOptions } from "../../queries/public";
import { isModalOpen } from "../../stores/modals";
import { AnimatedModal } from "../common/AnimatedModal";
import AsyncContent from "../common/AsyncContent";
import { Button } from "../common/Button";

export function VersionHistoryModal(): JSXElement {
  const isOpen = (): boolean => isModalOpen("VersionHistory");

  const releases = useInfiniteQuery(() => ({
    ...getVersionHistoryQueryOptions(),
    enabled: isOpen(),
  }));

  const scrollToLoadMore = (e: Event): void => {
    const element = e.target as HTMLElement;

    if (
      element.scrollHeight - element.scrollTop - element.clientHeight < 10 &&
      releases.hasNextPage &&
      !releases.isLoading
    ) {
      void releases.fetchNextPage();
    }
  };

  return (
    <AnimatedModal
      id="VersionHistory"
      modalClass="max-w-6xl"
      onScrollEnd={scrollToLoadMore}
    >
      <AsyncContent
        query={releases}
        errorMessage="Failed to load version history"
      >
        {(data) => (
          <>
            <div class="releases">
              <For each={data.pages.flatMap((it) => it.releases)}>
                {(release) => <ReleaseItem {...release} />}
              </For>
            </div>

            <Button
              onClick={() => void releases.fetchNextPage()}
              disabled={!releases.hasNextPage || releases.isFetching}
              fa={
                releases.isFetchingNextPage
                  ? { icon: "fa-circle-notch", spin: true, fixedWidth: true }
                  : undefined
              }
              text={
                releases.isFetchingNextPage
                  ? ""
                  : releases.hasNextPage
                    ? "Load More"
                    : "Nothing more to load"
              }
            />
          </>
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
