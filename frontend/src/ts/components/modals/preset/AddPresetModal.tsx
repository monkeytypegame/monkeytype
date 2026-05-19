import {
  ConfigGroupName,
  ConfigGroupNameSchema,
} from "@monkeytype/schemas/configs";
import { PresetNameSchema, PresetType } from "@monkeytype/schemas/presets";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement } from "solid-js";

import { addPreset } from "../../../collections/presets";
import { createEffectOn } from "../../../hooks/effects";
import { hideLoaderBar, showLoaderBar } from "../../../states/loader-bar";
import { hideModal, isModalOpen } from "../../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../../states/notifications";
import { normalizeName } from "../../../utils/strings";
import { AnimatedModal } from "../../common/AnimatedModal";
import { Checkbox } from "../../ui/form/Checkbox";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import { allFieldsMandatory, fromSchema } from "../../ui/form/utils";
import { FullOrPartial } from "./FullOrPartial";
import {
  getActiveSettingGroups,
  getCheckboxes,
  getConfigChanges,
} from "./preset-modal-utils";

export function AddPresetModal(): JSXElement {
  const [presetType, setPresetType] = createSignal<PresetType>("full");

  const form = createForm(() => ({
    defaultValues: {
      presetName: "",
      ...Object.fromEntries(
        ConfigGroupNameSchema.options.map((key) => [key, true]),
      ),
    } as { presetName: string } & Record<ConfigGroupName, boolean>,
    /*
    validators: {
      onChange: ({ value }) => {
        if (
          presetType() === "partial" &&
          Object.values(getCheckboxes(value)).every((v) => !v)
        ) {
          return "At least one setting group must be active while saving partial presets";
        }
        return undefined;
      },
    },*/
    validators: {
      onChange: allFieldsMandatory(),
    },
    onSubmit: async ({ value }) => {
      const parsedName = PresetNameSchema.safeParse(
        normalizeName(value.presetName),
      );
      if (!parsedName.success) {
        showNoticeNotification("Preset name is not valid");
        return;
      }

      const checkboxes = getCheckboxes(value);

      //obsolete if we add form level validation
      if (
        presetType() === "partial" &&
        Object.values(checkboxes).every((v) => !v)
      ) {
        showNoticeNotification(
          "At least one setting group must be active while saving partial presets",
        );
        return;
      }

      const configChanges = getConfigChanges(presetType(), checkboxes);
      const activeSettingGroups = getActiveSettingGroups(checkboxes);

      hideModal("AddPresetModal");
      showLoaderBar();

      try {
        await addPreset({
          name: parsedName.data,
          config: configChanges,
          settingGroups:
            presetType() === "partial" ? activeSettingGroups : undefined,
        });
        showSuccessNotification("Preset added", { durationMs: 2000 });
      } catch (e) {
        showErrorNotification(
          e instanceof Error ? e.message : "Failed to add preset",
        );
      }

      hideLoaderBar();
    },
  }));

  createEffectOn(
    () => isModalOpen("AddPresetModal"),
    (open) => {
      if (open) {
        form.reset();
        setPresetType("full");
      }
    },
  );

  //  const formErrorMap = form.useStore((state) => state.errorMap);

  return (
    <AnimatedModal id="AddPresetModal" title="Add new preset">
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="presetName"
          validators={{
            onChange: fromSchema(PresetNameSchema, { convert: normalizeName }),
          }}
          children={(field) => (
            <InputField field={field} placeholder="preset name" />
          )}
        />
        <FullOrPartial
          type={presetType()}
          onTypeChange={setPresetType}
          renderCheckbox={(group, label) => (
            <form.Field name={group as ConfigGroupName}>
              {(field) => <Checkbox field={field} label={label} />}
            </form.Field>
          )}
        />
        {/*
        <Show when={formErrorMap().onChange} fallback={null}>
          <div>{formErrorMap().onChange}</div>
        </Show>
        */}
        <SubmitButton form={form} variant="button" text="add" />
      </form>
    </AnimatedModal>
  );
}
