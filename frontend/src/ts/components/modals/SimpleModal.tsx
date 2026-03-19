import { format as dateFormat } from "date-fns/format";
import {
  createEffect,
  createSignal,
  For,
  JSXElement,
  on,
  Show,
} from "solid-js";

import { showNoticeNotification } from "../../states/notifications";
import {
  simpleModalConfig,
  SimpleModalInput,
  executeSimpleModal,
} from "../../states/simple-modal";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Conditional } from "../common/Conditional";

const inputClass = "w-full";

export function SimpleModal(): JSXElement {
  const [inputValues, setInputValues] = createSignal<string[]>([]);
  const [submitting, setSubmitting] = createSignal(false);

  const config = simpleModalConfig;

  const resetInputs = (): void => {
    const c = config();
    if (c === null) return;
    const vals = (c.inputs ?? []).map((input) => {
      if (input.type === "checkbox") {
        return input.initVal ? "true" : "false";
      }
      if (input.type === "datetime-local" && input.initVal !== undefined) {
        return dateFormat(input.initVal, "yyyy-MM-dd'T'HH:mm:ss");
      }
      if (input.type === "date" && input.initVal !== undefined) {
        return dateFormat(input.initVal, "yyyy-MM-dd");
      }
      return input.initVal?.toString() ?? "";
    });
    setInputValues(vals);
    setSubmitting(false);
  };

  createEffect(on(config, resetInputs));

  const updateValue = (index: number, value: string): void => {
    setInputValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const hasMissingRequired = (): boolean => {
    const c = config();
    if (c === null) return false;
    const inputs = c.inputs ?? [];
    return inputs.some(
      (input, i) =>
        !input.hidden &&
        !input.optional &&
        input.type !== "checkbox" &&
        (inputValues()[i] === undefined || inputValues()[i] === ""),
    );
  };

  const handleSubmit = async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();
    if (submitting()) return;

    if (hasMissingRequired()) {
      showNoticeNotification("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await executeSimpleModal(inputValues());
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (input: SimpleModalInput, index: number): JSXElement => {
    const value = (): string => inputValues()[index] ?? "";
    const disabled = (): boolean => submitting() || (input.disabled ?? false);
    const required = !input.hidden && !input.optional;

    switch (input.type) {
      case "textarea":
        return (
          <textarea
            class={cn(inputClass, input.hidden && "hidden")}
            placeholder={input.placeholder}
            value={value()}
            disabled={disabled()}
            required={required}
            //@ts-expect-error this is fine
            autoComplete="off"
            onInput={(e) => {
              updateValue(index, e.currentTarget.value);
              input.oninput?.(e);
            }}
          ></textarea>
        );

      case "checkbox":
        return (
          <label
            class={cn(
              "flex cursor-pointer items-center gap-2",
              disabled() && "opacity-50",
            )}
          >
            <input
              type="checkbox"
              checked={value() === "true"}
              disabled={disabled()}
              onChange={(e) => {
                updateValue(index, e.currentTarget.checked ? "true" : "false");
              }}
            />
            <div>{input.label}</div>
            <Show when={input.description}>
              <span class="text-xs text-sub">{input.description}</span>
            </Show>
          </label>
        );

      case "range":
        return (
          <div class="flex items-center gap-2">
            <input
              type="range"
              class={cn(input.hidden && "hidden", "w-full")}
              min={input.min}
              max={input.max}
              step={input.step}
              value={value()}
              disabled={disabled()}
              onInput={(e) => {
                updateValue(index, e.currentTarget.value);
                input.oninput?.(e);
              }}
            />
            <span class="text-sub">{value()}</span>
          </div>
        );

      case "datetime-local":
      case "date":
        return (
          <input
            type={input.type}
            class={cn(inputClass, input.hidden && "hidden")}
            value={value()}
            disabled={disabled()}
            required={required}
            min={
              input.min !== undefined
                ? dateFormat(
                    input.min,
                    input.type === "date"
                      ? "yyyy-MM-dd"
                      : "yyyy-MM-dd'T'HH:mm:ss",
                  )
                : undefined
            }
            max={
              input.max !== undefined
                ? dateFormat(
                    input.max,
                    input.type === "date"
                      ? "yyyy-MM-dd"
                      : "yyyy-MM-dd'T'HH:mm:ss",
                  )
                : undefined
            }
            onInput={(e) => {
              updateValue(index, e.currentTarget.value);
              input.oninput?.(e);
            }}
          />
        );

      default:
        return (
          <input
            type={input.type}
            class={cn(inputClass, input.hidden && "hidden")}
            placeholder={input.placeholder}
            value={value()}
            disabled={disabled()}
            required={required}
            autocomplete="off"
            min={input.type === "number" ? input.min?.toString() : undefined}
            max={input.type === "number" ? input.max?.toString() : undefined}
            onInput={(e) => {
              updateValue(index, e.currentTarget.value);
              input.oninput?.(e);
            }}
          />
        );
    }
  };

  return (
    <AnimatedModal
      id="SimpleModal"
      title={config()?.title}
      focusFirstInput={true}
      beforeShow={resetInputs}
    >
      <form class="grid gap-4" onSubmit={(e) => void handleSubmit(e)}>
        <Show when={config()?.text}>
          {(text) => (
            <div
              class="text-sub"
              {...(config()?.textAllowHtml
                ? { innerHTML: text() }
                : { textContent: text() })}
            ></div>
          )}
        </Show>
        <Show when={(config()?.inputs?.length ?? 0) > 0}>
          <div class={cn("grid gap-2")}>
            <For each={config()?.inputs}>
              {(input, i) => (
                <Show when={!input.hidden}>
                  <Conditional
                    if={input.label !== undefined && input.label !== ""}
                    then={
                      <label class="grid w-full grid-cols-[1fr_2fr] items-center gap-2 text-sub">
                        <div>{input.label}</div>
                        {renderInput(input, i())}
                      </label>
                    }
                    else={renderInput(input, i())}
                  />
                </Show>
              )}
            </For>
          </div>
        </Show>
        <Show when={config()?.buttonText}>
          <Button
            type="submit"
            variant="button"
            class="w-full"
            disabled={submitting() || hasMissingRequired()}
            text={config()?.buttonText}
          />
        </Show>
      </form>
    </AnimatedModal>
  );
}
