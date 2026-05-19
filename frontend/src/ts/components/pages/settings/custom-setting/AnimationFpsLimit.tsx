import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import { fpsLimitSchema, getfpsLimit, setfpsLimit } from "../../../../anim";
import { useSavedIndicator } from "../../../../hooks/useSavedIndicator";
import { Button } from "../../../common/Button";
import { Separator } from "../../../common/Separator";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { Setting } from "../Setting";

export function AnimationFpsLimit(): JSXElement {
  const savedIndicator = useSavedIndicator();
  const form = createForm(() => ({
    defaultValues: {
      fpsLimit: "",
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.fpsLimit));
      if (val === getfpsLimit()) return;
      setfpsLimit(val);
      savedIndicator.flash();
    },
  }));

  return (
    <Setting
      key="animationFpsLimit"
      title="animation fps limit"
      description={`Limit the maximum fps for animations. Setting this to "native" will run the animations as fast as possible (at your monitor's refresh rate). Setting this above your monitor's refresh rate will have no effect.`}
      fa={{
        icon: "fa-video",
      }}
      inputs={
        <div class="grid gap-2">
          <Button
            text="native"
            active={getfpsLimit() === 1000}
            onClick={() => {
              setfpsLimit(1000);
              form.setFieldValue("fpsLimit", "");
              savedIndicator.hide();
            }}
          />
          <Separator text="or" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="fpsLimit"
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "Must be a number";
                  }
                  return fromSchema(fpsLimitSchema)({
                    value: val,
                  });
                },
                onBlur: () => {
                  void form.handleSubmit();
                },
              }}
              children={(field) => (
                <div class="relative">
                  <InputField
                    field={field}
                    placeholder={"custom limit"}
                    type="number"
                    resetToDefaultIfEmptyOnBlur
                  />
                  <savedIndicator.component />
                </div>
              )}
            />
          </form>
        </div>
      }
    />
  );
}
