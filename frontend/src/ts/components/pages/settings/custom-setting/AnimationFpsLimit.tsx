import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement } from "solid-js";

import { fpsLimitSchema, getfpsLimit, setfpsLimit } from "../../../../anim";
import { AnimeShow } from "../../../common/anime";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { Separator } from "../../../common/Separator";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { Setting } from "../Setting";

export function AnimationFpsLimit(): JSXElement {
  const [showSavedIndicator, setShowSavedIndicator] = createSignal(false);
  const form = createForm(() => ({
    defaultValues: {
      fpsLimit: "",
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.fpsLimit));
      if (val === getfpsLimit()) return;
      setfpsLimit(val);
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
    },
  }));

  return (
    <Setting
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
              setShowSavedIndicator(false);
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
                    showIndicator={field().state.value !== ""}
                    type="number"
                  />
                  <AnimeShow when={showSavedIndicator()}>
                    <div class="absolute top-0 right-0 rounded bg-sub-alt p-[0.5em] text-main">
                      <Fa icon="fa-save" fixedWidth />
                    </div>
                  </AnimeShow>
                </div>
              )}
            />
          </form>
        </div>
      }
    />
  );
}
