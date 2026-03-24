import { Quote } from "@monkeytype/schemas/quotes";
import { createForm } from "@tanstack/solid-form";
import { format } from "date-fns/format";
import { JSXElement, createSignal, For, Show } from "solid-js";

import Ape from "../../ape";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Fa } from "../common/Fa";
import { InputField } from "../ui/form/InputField";

function QuoteApproveItem(props: {
  quote: Quote;
  onRemove: () => void;
}): JSXElement {
  const [disabled, setDisabled] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      text: props.quote.text,
      source: props.quote.source,
    },
  }));

  const isEdited = (): boolean => form.state.isDirty;

  const undo = (): void => {
    form.reset();
  };

  const approve = async (): Promise<void> => {
    if (!confirm("Are you sure?")) return;
    setDisabled(true);

    showLoaderBar();
    const response = await Ape.quotes.approveSubmission({
      body: { quoteId: props.quote._id },
    });
    hideLoaderBar();

    if (response.status !== 200) {
      setDisabled(false);
      showErrorNotification("Failed to approve quote", { response });
      return;
    }

    showSuccessNotification(`Quote approved. ${response.body.message ?? ""}`);
    props.onRemove();
  };

  const refuse = async (): Promise<void> => {
    if (!confirm("Are you sure?")) return;
    setDisabled(true);

    showLoaderBar();
    const response = await Ape.quotes.rejectSubmission({
      body: { quoteId: props.quote._id },
    });
    hideLoaderBar();

    if (response.status !== 200) {
      setDisabled(false);
      showErrorNotification("Failed to refuse quote", { response });
      return;
    }

    showSuccessNotification("Quote refused.");
    props.onRemove();
  };

  const editAndApprove = async (): Promise<void> => {
    if (!confirm("Are you sure?")) return;
    setDisabled(true);

    showLoaderBar();
    const response = await Ape.quotes.approveSubmission({
      body: {
        quoteId: props.quote._id,
        editText: form.state.values.text,
        editSource: form.state.values.source,
      },
    });
    hideLoaderBar();

    if (response.status !== 200) {
      setDisabled(false);
      showErrorNotification("Failed to approve quote", { response });
      return;
    }

    showSuccessNotification(
      `Quote edited and approved. ${response.body.message ?? ""}`,
    );
    props.onRemove();
  };

  return (
    <div class="bg-bg-secondary grid gap-2 rounded p-3">
      <form.Field
        name="text"
        children={(field) => (
          <textarea
            class="w-full rounded bg-bg p-2 text-text"
            value={field().state.value}
            onInput={(e) => field().handleChange(e.currentTarget.value)}
            onBlur={() => field().handleBlur()}
            disabled={disabled()}
          ></textarea>
        )}
      />
      <form.Field
        name="source"
        children={(field) => (
          <InputField
            class="w-full rounded bg-bg p-2 text-text"
            type="text"
            placeholder="Source"
            field={field}
            disabled={disabled()}
          />
        )}
      />
      <div class="flex gap-2">
        <Button
          variant="text"
          fa={{ icon: "fa-undo-alt", fixedWidth: true }}
          disabled={disabled() || !isEdited()}
          onClick={undo}
          balloon={{ text: "Undo changes", position: "left" }}
        />
        <Button
          variant="text"
          fa={{ icon: "fa-times", fixedWidth: true }}
          disabled={disabled()}
          onClick={() => void refuse()}
          balloon={{ text: "Refuse quote", position: "left" }}
        />
        <Show when={!isEdited()}>
          <Button
            variant="text"
            fa={{ icon: "fa-check", fixedWidth: true }}
            disabled={disabled()}
            onClick={() => void approve()}
            balloon={{ text: "Approve quote", position: "left" }}
          />
        </Show>
        <Show when={isEdited()}>
          <Button
            variant="text"
            fa={{ icon: "fa-pen", fixedWidth: true }}
            disabled={disabled()}
            onClick={() => void editAndApprove()}
            balloon={{ text: "Edit and approve quote", position: "left" }}
          />
        </Show>
      </div>
      <div class="flex gap-4 text-xs text-sub">
        <form.Field
          name="text"
          children={(field) => (
            <div class={cn(field().state.value.length < 60 && "text-error")}>
              <Fa icon="fa-ruler" fixedWidth /> {field().state.value.length}
            </div>
          )}
        />
        <div>
          <Fa icon="fa-globe-americas" fixedWidth /> {props.quote.language}
        </div>
        <div>
          <Fa icon="fa-calendar" fixedWidth />{" "}
          {format(new Date(props.quote.timestamp), "dd MMM yyyy HH:mm")}
        </div>
      </div>
    </div>
  );
}

export function QuoteApproveModal(): JSXElement {
  const [quotes, setQuotes] = createSignal<Quote[]>([]);

  const fetchQuotes = async (): Promise<void> => {
    showLoaderBar();
    const response = await Ape.quotes.get();
    hideLoaderBar();

    if (response.status !== 200) {
      showErrorNotification("Failed to get new quotes", { response });
      return;
    }

    setQuotes(response.body.data ?? []);
  };

  const handleBeforeShow = (): void => {
    setQuotes([]);
    void fetchQuotes();
  };

  const removeQuote = (index: number): void => {
    setQuotes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <AnimatedModal
      id="QuoteApprove"
      title="Approve quotes"
      beforeShow={handleBeforeShow}
      modalClass="max-w-4xl"
    >
      <div class="flex items-center justify-end">
        <Button
          variant="text"
          fa={{ icon: "fa-sync-alt" }}
          text="Refresh list"
          onClick={() => {
            setQuotes([]);
            void fetchQuotes();
          }}
        />
      </div>
      <div class="grid gap-2">
        <For each={quotes()}>
          {(quote, index) => (
            <QuoteApproveItem
              quote={quote}
              onRemove={() => removeQuote(index())}
            />
          )}
        </For>
      </div>
    </AnimatedModal>
  );
}
