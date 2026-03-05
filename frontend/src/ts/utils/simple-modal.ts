import AnimatedModal, { HideOptions, ShowOptions } from "./animated-modal";
import { Attributes, buildTag } from "./tag-builder";
import { format as dateFormat } from "date-fns/format";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Notifications from "../elements/notifications";
import {
  IsValidResponse,
  ValidatedHtmlInputElement,
  Validation,
  ValidationOptions,
  ValidationResult,
} from "../elements/input-validation";
import { ElementWithUtils, qsr } from "./dom";

const simpleModalEl = qsr<HTMLDialogElement>("#simpleModal");

type CommonInput<TType, TValue> = {
  type: TType;
  initVal?: TValue;
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  optional?: boolean;
  label?: string;
  oninput?: (event: Event) => void;
  /**
   * Validate the input value and indicate the validation result next to the input.
   * If the schema is defined it is always checked first.
   * Only if the schema validaton is passed or missing the `isValid` method is called.
   */
  validation?: Omit<Validation<string>, "isValid"> & {
    /**
     * Custom async validation method.
     * This is intended to be used for validations that cannot be handled with a Zod schema like server-side validations.
     * @param value current input value
     * @param thisPopup the current modal
     * @returns true if the `value` is valid, an errorMessage as string if it is invalid.
     */
    isValid?: (
      value: string,
      thisPopup: SimpleModal,
    ) => Promise<IsValidResponse>;
  };
};

export type TextInput = CommonInput<"text", string>;
export type TextArea = CommonInput<"textarea", string>;
export type PasswordInput = CommonInput<"password", string>;
type EmailInput = CommonInput<"email", string>;

type RangeInput = {
  min: number;
  max: number;
  step?: number;
} & CommonInput<"range", number>;

type DateTimeInput = {
  min?: Date;
  max?: Date;
} & CommonInput<"datetime-local", Date>;
type DateInput = {
  min?: Date;
  max?: Date;
} & CommonInput<"date", Date>;

type CheckboxInput = {
  label: string;
  placeholder?: never;
  description?: string;
} & CommonInput<"checkbox", boolean>;

type NumberInput = {
  min?: number;
  max?: number;
} & CommonInput<"number", number>;

type CommonInputType =
  | TextInput
  | TextArea
  | PasswordInput
  | EmailInput
  | RangeInput
  | DateTimeInput
  | DateInput
  | CheckboxInput
  | NumberInput;

export type ExecReturn = {
  status: 1 | 0 | -1;
  message: string;
  showNotification?: false;
  notificationOptions?: Notifications.AddNotificationOptions;
  hideOptions?: HideOptions;
  afterHide?: () => void;
  alwaysHide?: boolean;
};

type FormInput = CommonInputType & {
  hasError?: boolean;
  currentValue: () => string;
};
type SimpleModalOptions = {
  id: string;
  title: string;
  inputs?: CommonInputType[];
  text?: string;
  textAllowHtml?: boolean;
  buttonText: string;
  execFn: (thisPopup: SimpleModal, ...params: string[]) => Promise<ExecReturn>;
  beforeInitFn?: (thisPopup: SimpleModal) => void;
  beforeShowFn?: (thisPopup: SimpleModal) => void;
  canClose?: boolean;
  hideCallsExec?: boolean;
  showLabels?: boolean;
  afterClickAway?: () => void;
};

export class SimpleModal {
  parameters: string[];
  wrapper: ElementWithUtils<HTMLDialogElement>;
  element: ElementWithUtils;
  modal: AnimatedModal;
  id: string;
  title: string;
  inputs: FormInput[];
  text?: string;
  textAllowHtml: boolean;
  buttonText: string;
  execFn: (thisPopup: SimpleModal, ...params: string[]) => Promise<ExecReturn>;
  beforeInitFn: ((thisPopup: SimpleModal) => void) | undefined;
  beforeShowFn: ((thisPopup: SimpleModal) => void) | undefined;
  canClose: boolean;
  hideCallsExec: boolean;
  showLabels: boolean;
  afterClickAway: (() => void) | undefined;
  constructor(options: SimpleModalOptions) {
    this.parameters = [];
    this.id = options.id;
    this.execFn = options.execFn;
    this.title = options.title;
    this.inputs = (options.inputs as FormInput[]) ?? [];
    this.text = options.text;
    this.textAllowHtml = options.textAllowHtml ?? false;
    this.wrapper = modal.getWrapper();
    this.element = modal.getModal();
    this.modal = modal;
    this.buttonText = options.buttonText;
    this.beforeInitFn = options.beforeInitFn;
    this.beforeShowFn = options.beforeShowFn;
    this.canClose = options.canClose ?? true;
    this.hideCallsExec = options.hideCallsExec ?? false;
    this.showLabels = options.showLabels ?? false;
    this.afterClickAway = options.afterClickAway;
  }
  reset(): void {
    this.element.setHtml(`
    <div class="title"></div>
    <div class="inputs"></div>
    <div class="text"></div>
    <button type="submit" class="submitButton"></button>`);
  }

  init(): void {
    this.reset();
    this.element.setAttribute("data-popup-id", this.id);
    this.element.qs(".title")?.setText(this.title);
    if (this.textAllowHtml) {
      this.element.qs(".text")?.setHtml(this.text ?? "");
    } else {
      this.element.qs(".text")?.setText(this.text ?? "");
    }

    this.initInputs();

    if (this.buttonText === "") {
      this.element.qs(".submitButton")?.remove();
    } else {
      this.element.qs(".submitButton")?.setText(this.buttonText);
      this.updateSubmitButtonState();
    }

    if ((this.text ?? "") === "") {
      this.element.qs(".text")?.hide();
    } else {
      this.element.qs(".text")?.show();
    }
  }

  initInputs(): void {
    const allInputsHidden = this.inputs.every((i) => i.hidden);
    if (allInputsHidden || this.inputs.length === 0) {
      this.element.qs(".inputs")?.hide();
      return;
    }

    const inputsEl = this.element.qs(".inputs");
    if (this.showLabels) inputsEl?.addClass("withLabel");

    this.inputs.forEach((input, index) => {
      const id = `${this.id}_${index}`;

      if (this.showLabels && !input.hidden) {
        inputsEl?.appendHtml(`<label for="${id}">${input.label ?? ""}</label>`);
      }

      const tagname = input.type === "textarea" ? "textarea" : "input";
      const classes = input.hidden ? ["hidden"] : undefined;
      const attributes: Attributes = {
        id: id,
        placeholder: input.placeholder ?? "",
        autocomplete: "off",
      };

      if (input.type !== "textarea") {
        attributes["value"] = input.initVal?.toString() ?? "";
        attributes["type"] = input.type;
      }
      if (!input.hidden && !input.optional) {
        attributes["required"] = true;
      }
      if (input.disabled) {
        attributes["disabled"] = true;
      }

      if (input.type === "textarea") {
        inputsEl?.appendHtml(
          buildTag({
            tagname,
            classes,
            attributes,
            innerHTML: input.initVal,
          }),
        );
      } else if (input.type === "checkbox") {
        let html = buildTag({ tagname, classes, attributes });

        if (input.description !== undefined) {
          html += `<span>${input.description}</span>`;
        }
        if (!this.showLabels) {
          html = `
          <label class="checkbox">
            ${html}
            <div>${input.label}</div>
          </label>
        `;
        } else {
          html = `<div>${html}</div>`;
        }
        inputsEl?.appendHtml(html);
      } else if (input.type === "range") {
        inputsEl?.appendHtml(`
          <div>
            ${buildTag({
              tagname,
              classes,
              attributes: {
                ...attributes,
                min: input.min.toString(),
                max: input.max.toString(),
                step: input.step?.toString(),
                oninput: "this.nextElementSibling.innerHTML = this.value",
              },
            })}
            <span>${input.initVal ?? ""}</span>
          </div>
          `);
      } else {
        switch (input.type) {
          case "text":
          case "password":
          case "email":
            break;

          case "datetime-local": {
            if (input.min !== undefined) {
              attributes["min"] = dateFormat(
                input.min,
                "yyyy-MM-dd'T'HH:mm:ss",
              );
            }
            if (input.max !== undefined) {
              attributes["max"] = dateFormat(
                input.max,
                "yyyy-MM-dd'T'HH:mm:ss",
              );
            }
            if (input.initVal !== undefined) {
              attributes["value"] = dateFormat(
                input.initVal,
                "yyyy-MM-dd'T'HH:mm:ss",
              );
            }
            break;
          }
          case "date": {
            if (input.min !== undefined) {
              attributes["min"] = dateFormat(input.min, "yyyy-MM-dd");
            }
            if (input.max !== undefined) {
              attributes["max"] = dateFormat(input.max, "yyyy-MM-dd");
            }
            if (input.initVal !== undefined) {
              attributes["value"] = dateFormat(input.initVal, "yyyy-MM-dd");
            }
            break;
          }
          case "number": {
            attributes["min"] = input.min?.toString();
            attributes["max"] = input.max?.toString();
            break;
          }
        }
        inputsEl?.appendHtml(buildTag({ tagname, classes, attributes }));
      }
      const element = qsr<HTMLInputElement>("#" + attributes["id"]);

      const originalOnInput = element.native.oninput;
      element.native.oninput = (e) => {
        if (originalOnInput) originalOnInput.call(element.native, e);
        input.oninput?.(e);
        this.updateSubmitButtonState();
      };

      input.currentValue = () => {
        if (element.native.type === "checkbox") {
          return element.native.checked ? "true" : "false";
        }
        return element.native.value;
      };

      if (input.validation !== undefined) {
        const options: ValidationOptions<string> = {
          schema: input.validation.schema ?? undefined,
          isValid:
            input.validation.isValid !== undefined
              ? async (val: string) => {
                  //@ts-expect-error this is fine
                  return input.validation.isValid(val, this);
                }
              : undefined,

          callback: (result: ValidationResult) => {
            input.hasError = result.status !== "success";

            this.updateSubmitButtonState();
          },
          debounceDelay: input.validation.debounceDelay,
        };

        new ValidatedHtmlInputElement(element, options);
      }
    });

    this.element.qs(".inputs")?.show();
  }

  exec(): void {
    if (!this.canClose) return;
    if (this.hasMissingRequired()) {
      Notifications.add("Please fill in all fields", 0);
      return;
    }

    if (this.hasValidationErrors()) {
      Notifications.add("Please solve all validation errors", 0);
      return;
    }

    this.disableInputs();
    showLoaderBar();
    const vals: string[] = this.inputs.map((it) => it.currentValue());
    void this.execFn(this, ...vals).then((res) => {
      hideLoaderBar();
      if (res.showNotification ?? true) {
        Notifications.add(res.message, res.status, res.notificationOptions);
      }
      if (res.status === 1 || res.alwaysHide) {
        void this.hide(true, res.hideOptions).then(() => {
          if (res.afterHide) {
            res.afterHide();
          }
        });
      } else {
        this.enableInputs();
        simpleModalEl.qsa("input")[0]?.focus();
      }
    });
  }

  disableInputs(): void {
    simpleModalEl.qsa("input").disable();
    simpleModalEl.qsa("button").disable();
    simpleModalEl.qsa("textarea").disable();
    simpleModalEl.qsa(".checkbox").addClass("disabled");
  }

  enableInputs(): void {
    simpleModalEl.qsa("input").enable();
    simpleModalEl.qsa("button").enable();
    simpleModalEl.qsa("textarea").enable();
    simpleModalEl.qsa(".checkbox").removeClass("disabled");
  }

  show(parameters: string[] = [], showOptions: ShowOptions): void {
    activePopup = this;
    this.parameters = parameters;
    void modal.show({
      focusFirstInput: true,
      ...showOptions,
      beforeAnimation: async () => {
        this.beforeInitFn?.(this);
        this.init();
        this.beforeShowFn?.(this);
      },
    });
  }

  async hide(callerIsExec?: boolean, hideOptions?: HideOptions): Promise<void> {
    if (!this.canClose) return;
    if (this.hideCallsExec && !callerIsExec) {
      this.exec();
    } else {
      activePopup = null;
      await modal.hide(hideOptions);
    }
  }

  hasMissingRequired(): boolean {
    return this.inputs
      .filter((i) => i.hidden !== true && i.optional !== true)
      .some((v) => v.currentValue() === undefined || v.currentValue() === "");
  }

  hasValidationErrors(): boolean {
    return this.inputs.some((i) => i.hasError === true);
  }

  updateSubmitButtonState(): void {
    const button = this.element.qs<HTMLButtonElement>(".submitButton");
    if (button === null) return;

    if (this.hasMissingRequired() || this.hasValidationErrors()) {
      button.disable();
    } else {
      button.enable();
    }
  }
}

function hide(): void {
  if (activePopup) {
    void activePopup.hide();
    return;
  }
}

let activePopup: SimpleModal | null = null;

const modal = new AnimatedModal({
  dialogId: "simpleModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.on("submit", (e) => {
      e.preventDefault();
      activePopup?.exec();
    });
  },
  customEscapeHandler: (e): void => {
    hide();
  },
  customWrapperClickHandler: (e): void => {
    activePopup?.afterClickAway?.();
    hide();
  },
});
