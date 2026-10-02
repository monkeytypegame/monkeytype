import { createMemo, createResource, createSignal, For, Show } from "solid-js";

import { setConfig } from "../../config/setters";
import { Config, getConfig } from "../../config/store";
import { LayoutsList } from "../../constants/layouts";
import { restartTestEvent } from "../../events/test";
import { generateExercise } from "../../practice/generator";
import {
  getKeys,
  fingerLabels,
  hasVerifiedMapping,
} from "../../practice/layouts";
import {
  charactersForPreset,
  needsMapping,
  presetGroups,
  selectPreset,
} from "../../practice/presets";
import {
  applyKeySelection,
  getKeySelection,
  matchesSelection,
} from "../../practice/selection";
import {
  defaultConfig,
  type PracticeConfig,
  practiceConfigSchema,
} from "../../practice/types";
import { hideModalAndClearChain, isModalOpen } from "../../states/modals";
import {
  isTestActive,
  isResultCalculating,
  isTestRestarting,
} from "../../states/test";
import * as CustomText from "../../test/custom-text";
import { cn } from "../../utils/cn";
import { getLanguage, getLayout } from "../../utils/json-data";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

export function KeySelectionModal() {
  const [draft, setDraft] = createSignal<PracticeConfig>(
    structuredClone(defaultConfig),
  );
  const [family, setFamily] = createSignal("hands");
  const [add, setAdd] = createSignal(false);
  const [error, setError] = createSignal("");
  const [nonce, setNonce] = createSignal(0);
  const [layout] = createResource(
    () => (isModalOpen("KeySelection") ? draft().layout : false),
    async (name) => getLayout(name),
  );
  const [language] = createResource(
    () =>
      isModalOpen("KeySelection") &&
      draft().style === "words" &&
      ["time", "words"].includes(getConfig.mode)
        ? getConfig.language
        : false,
    async (name) => getLanguage(name),
  );
  const keys = createMemo(() => {
    if (layout.loading || layout.error !== undefined) return [];
    const data = layout();
    return data === undefined ? [] : getKeys(data, draft().layout);
  });
  const available = createMemo(() =>
    keys().flatMap((key) =>
      draft().layer === "both"
        ? key.variants
        : key.variants.slice(
            draft().layer === "shift" ? 1 : 0,
            draft().layer === "shift" ? 2 : 1,
          ),
    ),
  );
  const preview = createMemo(() => {
    nonce();
    if (layout.error !== undefined || language.error !== undefined) {
      return "Could not load practice assets.";
    }
    const config = draft();
    if (config.characters.length === 0 || layout.loading || language.loading) {
      return "";
    }
    if (getConfig.mode === "zen") {
      return "Free typing. Use the selected-key guide to practise your own text.";
    }
    if (getConfig.mode === "quote") {
      return "Only complete quotes that match your keys will appear. Add uppercase letters and punctuation for more matches.";
    }
    if (getConfig.mode === "custom") {
      const matching = CustomText.getText().filter((text) =>
        matchesSelection(text, config.characters),
      );
      return matching.length > 0
        ? matching.slice(0, 12).join(" ")
        : "No custom text matches. Edit your text or select more keys.";
    }
    try {
      const exercise = generateExercise(
        { ...config, amount: 12 },
        language()?.words ?? [],
      );
      return exercise.tokens.length > 0
        ? exercise.tokens.join(" ")
        : "No words match. Try balanced drills or select more keys.";
    } catch {
      return "Check your key selection and group lengths.";
    }
  });
  const patch = (value: Partial<PracticeConfig>) =>
    setDraft((current) => ({ ...current, ...value }));
  const choosePreset = (id: string) => {
    setDraft(selectPreset(draft(), id, keys(), add()));
    setError("");
  };
  const changeFilter = (value: Partial<PracticeConfig>) => {
    const next = { ...draft(), ...value };
    const allowed = charactersForPreset(keys(), next);
    next.characters =
      next.preset === "custom"
        ? next.characters.filter((char) => allowed.includes(char))
        : allowed;
    patch(next);
  };
  const apply = () => {
    if (isTestRestarting() || isResultCalculating()) return;
    if (isTestActive() && Config.funbox.includes("no_quit")) {
      setError("Finish the no quit test before changing keys.");
      return;
    }
    const parsed = practiceConfigSchema.safeParse(draft());
    if (!parsed.success || draft().characters.length === 0) {
      setError(
        "Select keys and use group lengths from 1 to 6, with minimum no greater than maximum.",
      );
      return;
    }
    if (
      layout.loading ||
      layout.error !== undefined ||
      language.loading ||
      language.error !== undefined
    ) {
      return;
    }
    applyKeySelection(parsed.data);
    setConfig(
      "numbers",
      draft().characters.some((char) => /^[0-9]$/.test(char)),
      { nosave: true },
    );
    setConfig(
      "punctuation",
      draft().characters.some((char) => /[\p{P}\p{S}]/u.test(char)),
      { nosave: true },
    );
    hideModalAndClearChain("KeySelection");
    restartTestEvent.dispatch();
  };
  return (
    <AnimatedModal
      id="KeySelection"
      title="Choose keys"
      modalClass="max-w-4xl"
      beforeShow={() => {
        const selected = getKeySelection();
        setDraft(structuredClone(selected ?? defaultConfig));
        setError("");
        setAdd(false);
      }}
    >
      <p class="text-sm text-sub">
        Keep your test mode and duration. Choose a hand, finger, or any
        combination of characters. Space separates words.
      </p>
      <div class="flex flex-wrap gap-4">
        <label class="grid gap-1 text-sm">
          keyboard layout
          <select
            aria-label="Keyboard layout"
            value={draft().layout}
            onChange={(e) => {
              patch({
                layout: e.currentTarget.value as PracticeConfig["layout"],
                preset: "custom",
                characters: [],
              });
            }}
          >
            <For each={LayoutsList}>
              {(name) => (
                <option value={name}>{name.replaceAll("_", " ")}</option>
              )}
            </For>
          </select>
        </label>
        <label class="grid gap-1 text-sm">
          characters
          <select
            value={draft().category}
            onChange={(e) =>
              changeFilter({
                category: e.currentTarget.value as PracticeConfig["category"],
              })
            }
          >
            <option value="letters">letters</option>
            <option value="digits">digits</option>
            <option value="symbols">punctuation &amp; symbols</option>
            <option value="all">all characters</option>
          </select>
        </label>
        <label class="grid gap-1 text-sm">
          key layer
          <select
            value={draft().layer}
            onChange={(e) =>
              changeFilter({
                layer: e.currentTarget.value as PracticeConfig["layer"],
              })
            }
          >
            <option value="base">base</option>
            <option value="shift">shift</option>
            <option value="both">base + shift</option>
          </select>
        </label>
      </div>
      <p class="text-xs text-sub">
        {hasVerifiedMapping(draft().layout)
          ? "US QWERTY finger positions verified."
          : "Choose keys manually on this layout. Hand and finger presets require a verified mapping."}{" "}
        Selection is case-sensitive.
      </p>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Preset families"
      >
        <For each={Object.keys(presetGroups)}>
          {(group) => (
            <Button
              text={group}
              active={family() === group}
              onClick={() => setFamily(group)}
            />
          )}
        </For>
      </div>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Key presets">
        <For each={presetGroups[family()]}>
          {(preset) => (
            <Button
              text={preset.label}
              active={draft().preset === preset.id}
              disabled={
                layout.loading ||
                (needsMapping(preset.id) && !hasVerifiedMapping(draft().layout))
              }
              onClick={() => choosePreset(preset.id)}
            />
          )}
        </For>
      </div>
      <label class="flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={add()}
          onChange={(e) => setAdd(e.currentTarget.checked)}
        />
        add to selection
      </label>
      <div
        class="overflow-x-auto py-2"
        role="group"
        aria-label="Select practice characters"
      >
        <div class="grid min-w-[36rem] gap-1">
          <For each={[0, 1, 2, 3]}>
            {(row) => (
              <div
                class={cn(
                  "flex justify-center gap-1",
                  row === 2 && "pl-4",
                  row === 3 && "pl-8",
                )}
              >
                <For each={keys().filter((key) => key.row === row)}>
                  {(key) => (
                    <div class="flex min-w-9 flex-1 flex-col gap-1">
                      <For
                        each={key.variants.filter(
                          (_, index) =>
                            draft().layer === "both" ||
                            index === (draft().layer === "shift" ? 1 : 0),
                        )}
                      >
                        {(char) => (
                          <button
                            type="button"
                            aria-label={`${char}${key.finger ? `, ${fingerLabels[key.finger]}` : ""}`}
                            aria-pressed={draft().characters.includes(char)}
                            class={cn(
                              "min-h-9 rounded px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-text",
                              draft().characters.includes(char)
                                ? "bg-main text-bg"
                                : "bg-sub-alt text-sub hover:text-text",
                            )}
                            onClick={() =>
                              patch({
                                preset: "custom",
                                characters: draft().characters.includes(char)
                                  ? draft().characters.filter(
                                      (value) => value !== char,
                                    )
                                  : [...draft().characters, char],
                              })
                            }
                          >
                            {char}
                          </button>
                        )}
                      </For>
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="mr-auto">
          {draft().characters.length} characters selected
        </span>
        <Button
          text="select all"
          variant="text"
          onClick={() =>
            patch({ preset: "custom", characters: [...new Set(available())] })
          }
        />
        <Button
          text="clear"
          variant="text"
          onClick={() => patch({ preset: "custom", characters: [] })}
        />
      </div>
      <Show when={["time", "words"].includes(getConfig.mode)}>
        <label class="grid gap-1 text-sm">
          exercise
          <select
            value={draft().style}
            onChange={(e) =>
              patch({ style: e.currentTarget.value as PracticeConfig["style"] })
            }
          >
            <option value="words">real words</option>
            <option value="balanced">balanced drills</option>
            <option value="patterns">patterns</option>
          </select>
        </label>
        <div class="flex gap-4">
          <label class="grid gap-1 text-sm">
            minimum length
            <input
              type="number"
              min="1"
              max="6"
              value={draft().minLength}
              onInput={(e) =>
                patch({ minLength: Number(e.currentTarget.value) })
              }
            />
          </label>
          <label class="grid gap-1 text-sm">
            maximum length
            <input
              type="number"
              min="1"
              max="6"
              value={draft().maxLength}
              onInput={(e) =>
                patch({ maxLength: Number(e.currentTarget.value) })
              }
            />
          </label>
        </div>
      </Show>
      <div class="rounded bg-sub-alt p-4 text-sm" aria-live="polite">
        {layout.loading || language.loading ? "Loading…" : preview()}
      </div>
      <Show when={layout.error !== undefined || language.error !== undefined}>
        <p class="text-error" role="alert">
          Could not load practice assets. Close and reopen to retry.
        </p>
      </Show>
      <Show when={error()}>
        <p class="text-error" role="alert">
          {error()}
        </p>
      </Show>
      <p class="text-xs text-sub">
        Selection lasts until cleared or reloaded. Focused results are not saved
        or ranked. Numbers and punctuation toggles limit the selected characters
        in time and words modes. Funboxes and challenges require clearing the
        selection.
      </p>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          text="refresh preview"
          variant="text"
          onClick={() => setNonce((value) => value + 1)}
        />
        <Button
          text="disable selection"
          variant="text"
          onClick={() => {
            if (
              isTestRestarting() ||
              isResultCalculating() ||
              (isTestActive() && Config.funbox.includes("no_quit"))
            ) {
              return;
            }
            applyKeySelection(null);
            hideModalAndClearChain("KeySelection");
            restartTestEvent.dispatch();
          }}
        />
        <Button
          text="apply keys"
          disabled={
            draft().characters.length === 0 ||
            layout.loading ||
            language.loading ||
            layout.error !== undefined ||
            language.error !== undefined
          }
          onClick={apply}
        />
      </div>
    </AnimatedModal>
  );
}
