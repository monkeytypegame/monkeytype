import {
  ConfigGroupName,
  ConfigGroupNameSchema,
} from "@monkeytype/schemas/configs";
import { PresetNameSchema, PresetType } from "@monkeytype/schemas/presets";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement, Show } from "solid-js";

import { createEffectOn } from "../../../hooks/effects";
import { editPreset, getPreset } from "../../../queries/presets";
import { editPresetData } from "../../../states/edit-preset-modal";
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
import { fromSchema } from "../../ui/form/utils";
import { FullOrPartial } from "./FullOrPartial";
import {
  getActiveSettingGroups,
  getCheckboxes,
  getConfigChanges,
} from "./preset-modal-utils";

export function EditPresetModal(): JSXElement {
  const [presetType, setPresetType] = createSignal<PresetType>("full");

  const form = createForm(() => ({
    defaultValues: {
      presetName: "",
      updateConfig: false,
      ...Object.fromEntries(
        ConfigGroupNameSchema.options.map((key) => [key, true]),
      ),
    } as { presetName: string; updateConfig: boolean } & Record<
      ConfigGroupName,
      boolean
    >,
    onSubmit: async ({ value }) => {
      const data = editPresetData();
      if (data === null) return;

      const parsedName = PresetNameSchema.safeParse(
        normalizeName(value.presetName),
      );
      if (!parsedName.success) {
        showNoticeNotification("Preset name is not valid");
        return;
      }

      const checkboxes = getCheckboxes(value);
      if (
        value.updateConfig &&
        presetType() === "partial" &&
        Object.values(checkboxes).every((v) => !v)
      ) {
        showNoticeNotification(
          "At least one setting group must be active while saving partial presets",
        );
        return;
      }

      hideModal("EditPresetModal");
      showLoaderBar();

      let result;
      if (value.updateConfig) {
        const configChanges = getConfigChanges(presetType(), checkboxes);
        const activeSettingGroups: ConfigGroupName[] | null =
          presetType() === "partial"
            ? getActiveSettingGroups(checkboxes)
            : null;
        result = await editPreset({
          presetId: data.presetId,
          name: parsedName.data,
          config: configChanges,
          settingGroups: activeSettingGroups,
        });
      } else {
        result = await editPreset({
          presetId: data.presetId,
          name: parsedName.data,
        });
      }
      if (result.error === null) {
        showSuccessNotification("Preset updated");
      } else {
        showErrorNotification("Failed to edit preset", {
          error: result.error,
        });
      }

      hideLoaderBar();
    },
  }));

  createEffectOn(
    () => isModalOpen("EditPresetModal"),
    (open) => {
      if (!open) return;
      const data = editPresetData();
      if (data === null) return;

      form.reset();
      form.setFieldValue("presetName", data.name);

      const preset = getPreset(data.presetId);
      if (preset === undefined) return;

      if (preset.settingGroups === undefined || preset.settingGroups === null) {
        setPresetType("full");
        for (const key of ConfigGroupNameSchema.options) {
          form.setFieldValue(key, true);
        }
      } else {
        setPresetType("partial");
        for (const key of ConfigGroupNameSchema.options) {
          form.setFieldValue(key, preset.settingGroups.includes(key));
        }
      }
    },
  );

  const isUpdateConfig = () => {
    const formValues = form.useSelector((s) => s.values);
    return formValues().updateConfig;
  };

  return (
    <AnimatedModal id="EditPresetModal" title="Edit preset">
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
        <form.Field name="updateConfig">
          {(field) => (
            <Checkbox field={field} label="update config to current" />
          )}
        </form.Field>
        <Show when={isUpdateConfig()}>
          <FullOrPartial
            type={presetType()}
            onTypeChange={setPresetType}
            renderCheckbox={(group, label) => (
              <form.Field name={group as ConfigGroupName}>
                {(field) => <Checkbox field={field} label={label} />}
              </form.Field>
            )}
          />
        </Show>
        <SubmitButton form={form} variant="button" text="save" />
      </form>
    </AnimatedModal>
  );
}
