import { JSXElement, Setter, Show } from "solid-js";
import { z } from "zod";

import { showSimpleModal } from "../../../states/simple-modal";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { LoadingCircle } from "../../common/LoadingCircle";

export function Navigation(props: {
  lastPage: number;
  userPage?: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onScrollToUser: Setter<boolean>;
  isLoading?: boolean;
  class?: string;
}): JSXElement {
  const buttonClass = "px-3 sm:px-4 text-em-base";
  const changePage = (page: number, options?: { scrollToUser?: boolean }) => {
    props.onPageChange(page);
    props.onScrollToUser(options?.scrollToUser ?? false);
  };

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
        onClick={() => changePage(0)}
        fa={{ icon: "fa-crown", fixedWidth: true }}
        disabled={props.currentPage === 0}
        class={buttonClass}
      />
      <Show when={props.userPage !== undefined}>
        <Button
          onClick={() =>
            changePage(props.userPage as number, { scrollToUser: true })
          }
          fa={{ icon: "fa-user", fixedWidth: true }}
          disabled={
            props.userPage === undefined || props.currentPage === props.userPage
          }
          class={buttonClass}
        />
      </Show>
      <Button
        onClick={() => {
          const newPage = Math.max(
            0,
            Math.min(props.currentPage, props.lastPage) - 1,
          );
          changePage(newPage);
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
              changePage(pageNumber - 1);
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
        onClick={() => changePage(props.currentPage + 1)}
        fa={{ icon: "fa-chevron-right", fixedWidth: true }}
        disabled={props.currentPage + 1 >= props.lastPage}
        class={buttonClass}
      />
    </div>
  );
}
