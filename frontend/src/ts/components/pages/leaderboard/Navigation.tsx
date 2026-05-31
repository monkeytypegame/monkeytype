import { JSXElement, Setter, Show } from "solid-js";
import { z } from "zod";

import { setPage } from "../../../states/leaderboard-selection";
import { showSimpleModal } from "../../../states/simple-modal";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { LoadingCircle } from "../../common/LoadingCircle";

export function Navigation(props: {
  lastPage: number;
  userPage?: number;
  currentPage: number;
  onPageChange: Setter<number>;
  onScrollToUser: Setter<boolean>;
  isLoading?: boolean;
  class?: string;
}): JSXElement {
  const buttonClass = "px-3 sm:px-4 text-em-base";

  return (
    <div
      class={cn(
        "grid grid-flow-col items-center gap-2 justify-self-end",
        props.class,
      )}
    >
      <Show when={props.isLoading}>
        <LoadingCircle color="sub" class="text-2xl" />
      </Show>
      <Button
        onClick={() => props.onPageChange(0)}
        fa={{ icon: "fa-crown", fixedWidth: true }}
        disabled={props.currentPage === 0}
        class={buttonClass}
      />
      <Show when={props.userPage !== undefined}>
        <Button
          onClick={() => {
            props.onPageChange(props.userPage as number);
            props.onScrollToUser(true);
          }}
          fa={{ icon: "fa-user", fixedWidth: true }}
          disabled={
            props.userPage === undefined || props.currentPage === props.userPage
          }
          class={buttonClass}
        />
      </Show>
      <Button
        onClick={() => {
          const lastPage = props.lastPage;
          props.onPageChange((old) => Math.max(0, Math.min(old, lastPage) - 1));
        }}
        fa={{ icon: "fa-chevron-left", fixedWidth: true }}
        disabled={props.currentPage === 0}
        class={buttonClass}
      />
      <Button
        onClick={() =>
          showSimpleModal({
            title: "Go to page",
            schema: z.object({
              //not using PageNumberSchema because we don't allow zero here
              pageNumber: z.number().int().safe().min(1),
            }),
            inputs: {
              pageNumber: {
                type: "number",
                placeholder: "Page number",
              },
            },
            buttonText: "Go",
            execFn: async ({ pageNumber }) => {
              setPage(pageNumber - 1);
              return {
                status: "success",
                showNotification: false,
              };
            },
          })
        }
        fa={{ icon: "fa-hashtag", fixedWidth: true }}
        class={buttonClass}
        disabled={props.lastPage <= 1}
      >
        {" "}
        {props.currentPage + 1}
      </Button>
      <Button
        onClick={() => props.onPageChange((old) => old + 1)}
        fa={{ icon: "fa-chevron-right", fixedWidth: true }}
        disabled={props.currentPage + 1 >= props.lastPage}
        class={buttonClass}
      />
    </div>
  );
}
