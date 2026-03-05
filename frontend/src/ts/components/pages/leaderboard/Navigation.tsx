import { JSXElement, Setter, Show } from "solid-js";

import { ExecReturn, SimpleModal } from "../../../utils/simple-modal";
import { Button } from "../../common/Button";
import { LoadingCircle } from "../../common/LoadingCircle";

export function Navigation(props: {
  lastPage: number;
  userPage?: number;
  currentPage: number;
  onPageChange: Setter<number>;
  onScrollToUser: Setter<boolean>;
  isLoading?: boolean;
}): JSXElement {
  const goToPageModal = new SimpleModal({
    id: "lbGoToPage",
    title: "Go to page",
    inputs: [
      {
        type: "number",
        placeholder: "Page number",
      },
    ],
    buttonText: "Go",
    execFn: async (_thisPopup, pageNumber): Promise<ExecReturn> => {
      const page = parseInt(pageNumber, 10);
      if (isNaN(page) || page < 1) {
        return {
          status: "notice",
          message: "Invalid page number",
        };
      }

      props.onPageChange(page - 1);

      return {
        status: "success",
        message: "Navigating to page " + page,
        showNotification: false,
      };
    },
  });

  const buttonClass = () => "px-3 sm:px-4 text-em-base";

  return (
    <div class="grid grid-flow-col items-center gap-2 justify-self-end">
      <Show when={props.isLoading}>
        <LoadingCircle color="sub" class="text-2xl" />
      </Show>
      <Button
        onClick={() => props.onPageChange(0)}
        fa={{ icon: "fa-crown", fixedWidth: true }}
        disabled={props.currentPage === 0}
        class={buttonClass()}
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
          class={buttonClass()}
        />
      </Show>
      <Button
        onClick={() => {
          const lastPage = props.lastPage;
          props.onPageChange((old) => Math.max(0, Math.min(old, lastPage) - 1));
        }}
        fa={{ icon: "fa-chevron-left", fixedWidth: true }}
        disabled={props.currentPage === 0}
        class={buttonClass()}
      />
      <Button
        onClick={() => goToPageModal.show(undefined, {})}
        fa={{ icon: "fa-hashtag", fixedWidth: true }}
        class={buttonClass()}
        disabled={props.lastPage <= 1}
      />
      <Button
        onClick={() => props.onPageChange((old) => old + 1)}
        fa={{ icon: "fa-chevron-right", fixedWidth: true }}
        disabled={props.currentPage + 1 >= props.lastPage}
        class={buttonClass()}
      />
    </div>
  );
}
