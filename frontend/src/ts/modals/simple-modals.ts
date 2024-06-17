import Ape from "../ape";
import * as AccountController from "../controllers/account-controller";
import * as DB from "../db";
import * as UpdateConfig from "../config";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as ThemePicker from "../elements/settings/theme-picker";
import * as CustomText from "../test/custom-text";
import * as AccountButton from "../elements/account-button";
import { FirebaseError } from "firebase/app";
import { Auth, isAuthenticated, getAuthenticatedUser } from "../firebase";
import * as ConnectionState from "../states/connection";
import {
  EmailAuthProvider,
  User,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  unlink,
} from "firebase/auth";
import {
  createErrorMessage,
  isDevEnvironment,
  isPasswordStrong,
  reloadAfter,
} from "../utils/misc";
import * as CustomTextState from "../states/custom-text-name";
import * as ThemeController from "../controllers/theme-controller";
import AnimatedModal, {
  HideOptions,
  ShowOptions,
} from "../utils/animated-modal";
import { format as dateFormat } from "date-fns/format";
import { Attributes, buildTag } from "../utils/tag-builder";

type CommonInput<TType, TValue> = {
  type: TType;
  initVal?: TValue;
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  optional?: boolean;
  label?: string;
  oninput?: (event: Event) => void;
};

type TextInput = CommonInput<"text", string>;
type TextArea = CommonInput<"textarea", string>;
type PasswordInput = CommonInput<"password", string>;
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

let activePopup: SimpleModal | null = null;

type ExecReturn = {
  status: 1 | 0 | -1;
  message: string;
  showNotification?: false;
  notificationOptions?: MonkeyTypes.AddNotificationOptions;
  hideOptions?: HideOptions;
  afterHide?: () => void;
};

type PopupKey =
  | "updateEmail"
  | "updateName"
  | "updatePassword"
  | "removeGoogleAuth"
  | "removeGithubAuth"
  | "removePasswordAuth"
  | "addPasswordAuth"
  | "deleteAccount"
  | "resetAccount"
  | "clearTagPb"
  | "optOutOfLeaderboards"
  | "clearTagPb"
  | "applyCustomFont"
  | "resetPersonalBests"
  | "resetSettings"
  | "revokeAllTokens"
  | "unlinkDiscord"
  | "generateApeKey"
  | "viewApeKey"
  | "deleteApeKey"
  | "editApeKey"
  | "deleteCustomText"
  | "deleteCustomTextLong"
  | "resetProgressCustomTextLong"
  | "updateCustomTheme"
  | "deleteCustomTheme"
  | "forgotPassword"
  | "devGenerateData";

const list: Record<PopupKey, SimpleModal | undefined> = {
  updateEmail: undefined,
  updateName: undefined,
  updatePassword: undefined,
  removeGoogleAuth: undefined,
  removeGithubAuth: undefined,
  removePasswordAuth: undefined,
  addPasswordAuth: undefined,
  deleteAccount: undefined,
  resetAccount: undefined,
  clearTagPb: undefined,
  optOutOfLeaderboards: undefined,
  applyCustomFont: undefined,
  resetPersonalBests: undefined,
  resetSettings: undefined,
  revokeAllTokens: undefined,
  unlinkDiscord: undefined,
  generateApeKey: undefined,
  viewApeKey: undefined,
  deleteApeKey: undefined,
  editApeKey: undefined,
  deleteCustomText: undefined,
  deleteCustomTextLong: undefined,
  resetProgressCustomTextLong: undefined,
  updateCustomTheme: undefined,
  deleteCustomTheme: undefined,
  forgotPassword: undefined,
  devGenerateData: undefined,
};

type SimpleModalOptions = {
  id: string;
  title: string;
  inputs?: CommonInputType[];
  text?: string;
  buttonText: string;
  execFn: (thisPopup: SimpleModal, ...params: string[]) => Promise<ExecReturn>;
  beforeInitFn?: (thisPopup: SimpleModal) => void;
  beforeShowFn?: (thisPopup: SimpleModal) => void;
  canClose?: boolean;
  onlineOnly?: boolean;
  hideCallsExec?: boolean;
  showLabels?: boolean;
};

const modal = new AnimatedModal({
  dialogId: "simpleModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.addEventListener("submit", (e) => {
      e.preventDefault();
      activePopup?.exec();
    });
  },
  customEscapeHandler: (e): void => {
    hide();
  },
  customWrapperClickHandler: (e): void => {
    hide();
  },
});

class SimpleModal {
  parameters: string[];
  wrapper: HTMLElement;
  element: HTMLElement;
  id: string;
  title: string;
  inputs: CommonInputType[];
  text?: string;
  buttonText: string;
  execFn: (thisPopup: SimpleModal, ...params: string[]) => Promise<ExecReturn>;
  beforeInitFn: ((thisPopup: SimpleModal) => void) | undefined;
  beforeShowFn: ((thisPopup: SimpleModal) => void) | undefined;
  canClose: boolean;
  onlineOnly: boolean;
  hideCallsExec: boolean;
  showLabels: boolean;
  constructor(options: SimpleModalOptions) {
    this.parameters = [];
    this.id = options.id;
    this.execFn = options.execFn;
    this.title = options.title;
    this.inputs = options.inputs ?? [];
    this.text = options.text;
    this.wrapper = modal.getWrapper();
    this.element = modal.getModal();
    this.buttonText = options.buttonText;
    this.beforeInitFn = options.beforeInitFn;
    this.beforeShowFn = options.beforeShowFn;
    this.canClose = options.canClose ?? true;
    this.onlineOnly = options.onlineOnly ?? false;
    this.hideCallsExec = options.hideCallsExec ?? false;
    this.showLabels = options.showLabels ?? false;
  }
  reset(): void {
    this.element.innerHTML = `
    <div class="title"></div>
    <div class="inputs"></div>
    <div class="text"></div>
    <button type="submit" class="submitButton"></button>`;
  }

  init(): void {
    const el = $(this.element);
    el.find("input").val("");
    this.reset();
    el.attr("data-popup-id", this.id);
    el.find(".title").text(this.title);
    el.find(".text").text(this.text ?? "");

    this.initInputs();

    if (this.buttonText === "") {
      el.find(".submitButton").remove();
    } else {
      el.find(".submitButton").text(this.buttonText);
    }

    if ((this.text ?? "") === "") {
      el.find(".text").addClass("hidden");
    } else {
      el.find(".text").removeClass("hidden");
    }

    // }
  }

  initInputs(): void {
    const el = $(this.element);

    const allInputsHidden = this.inputs.every((i) => i.hidden);
    if (allInputsHidden || this.inputs.length === 0) {
      el.find(".inputs").addClass("hidden");
      return;
    }

    const inputs = el.find(".inputs");
    if (this.showLabels) inputs.addClass("withLabel");

    this.inputs.forEach((input, index) => {
      const id = `${this.id}_${index}`;

      if (this.showLabels && !input.hidden) {
        inputs.append(`<label for="${id}">${input.label ?? ""}</label>`);
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
      if (!input.hidden && !input.optional === true) {
        attributes["required"] = true;
      }
      if (input.disabled) {
        attributes["disabled"] = true;
      }

      if (input.type === "textarea") {
        inputs.append(
          buildTag({
            tagname,
            classes,
            attributes,
            innerHTML: input.initVal,
          })
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
        inputs.append(html);
      } else if (input.type === "range") {
        inputs.append(`
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
                "yyyy-MM-dd'T'HH:mm:ss"
              );
            }
            if (input.max !== undefined) {
              attributes["max"] = dateFormat(
                input.max,
                "yyyy-MM-dd'T'HH:mm:ss"
              );
            }
            if (input.initVal !== undefined) {
              attributes["value"] = dateFormat(
                input.initVal,
                "yyyy-MM-dd'T'HH:mm:ss"
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
        inputs.append(buildTag({ tagname, classes, attributes }));
      }
      if (input.oninput !== undefined) {
        (
          document.querySelector("#" + attributes["id"]) as HTMLElement
        ).oninput = input.oninput;
      }
    });

    el.find(".inputs").removeClass("hidden");
  }

  exec(): void {
    if (!this.canClose) return;
    const vals: string[] = [];
    for (const el of $("#simpleModal input, #simpleModal textarea")) {
      if ($(el).is(":checkbox")) {
        vals.push($(el).is(":checked") ? "true" : "false");
      } else {
        vals.push($(el).val() as string);
      }
    }

    type CommonInputWithCurrentValue = CommonInputType & {
      currentValue: string | undefined;
    };

    const inputsWithCurrentValue: CommonInputWithCurrentValue[] = [];
    for (let i = 0; i < this.inputs.length; i++) {
      inputsWithCurrentValue.push({
        ...(this.inputs[i] as CommonInputType),
        currentValue: vals[i],
      });
    }

    if (
      inputsWithCurrentValue
        .filter((i) => i.hidden !== true && i.optional !== true)
        .some((v) => v.currentValue === undefined || v.currentValue === "")
    ) {
      Notifications.add("Please fill in all fields", 0);
      return;
    }

    this.disableInputs();
    Loader.show();
    void this.execFn(this, ...vals).then((res) => {
      Loader.hide();
      if (res.showNotification ?? true) {
        Notifications.add(res.message, res.status, res.notificationOptions);
      }
      if (res.status === 1) {
        void this.hide(true, res.hideOptions).then(() => {
          if (res.afterHide) {
            res.afterHide();
          }
        });
      } else {
        this.enableInputs();
        $($("#simpleModal").find("input")[0] as HTMLInputElement).trigger(
          "focus"
        );
      }
    });
  }

  disableInputs(): void {
    $("#simpleModal input").prop("disabled", true);
    $("#simpleModal button").prop("disabled", true);
    $("#simpleModal textarea").prop("disabled", true);
    $("#simpleModal .checkbox").addClass("disabled");
  }

  enableInputs(): void {
    $("#simpleModal input").prop("disabled", false);
    $("#simpleModal button").prop("disabled", false);
    $("#simpleModal textarea").prop("disabled", false);
    $("#simpleModal .checkbox").removeClass("disabled");
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
}

function hide(): void {
  if (activePopup) {
    void activePopup.hide();
    return;
  }
}

type AuthMethod = "password" | "github.com" | "google.com";

type ReauthSuccess = {
  status: 1;
  message: string;
  user: User;
};

type ReauthFailed = {
  status: -1 | 0;
  message: string;
};

type ReauthenticateOptions = {
  excludeMethod?: AuthMethod;
  password?: string;
};

function getPreferredAuthenticationMethod(
  exclude?: AuthMethod
): AuthMethod | undefined {
  const authMethods = ["password", "github.com", "google.com"] as AuthMethod[];
  const filteredMethods = authMethods.filter((it) => it !== exclude);
  for (const method of filteredMethods) {
    if (isUsingAuthentication(method)) return method;
  }
  return undefined;
}

function isUsingPasswordAuthentication(): boolean {
  return isUsingAuthentication("password");
}

function isUsingGithubAuthentication(): boolean {
  return isUsingAuthentication("github.com");
}

function isUsingGoogleAuthentication(): boolean {
  return isUsingAuthentication("google.com");
}

function isUsingAuthentication(authProvider: AuthMethod): boolean {
  return (
    Auth?.currentUser?.providerData.some(
      (p) => p.providerId === authProvider
    ) || false
  );
}

async function reauthenticate(
  options: ReauthenticateOptions
): Promise<ReauthSuccess | ReauthFailed> {
  if (Auth === undefined) {
    return {
      status: -1,
      message: "Authentication is not initialized",
    };
  }

  if (!isAuthenticated()) {
    return {
      status: -1,
      message: "User is not signed in",
    };
  }
  const user = getAuthenticatedUser();
  const authMethod = getPreferredAuthenticationMethod(options.excludeMethod);

  try {
    if (authMethod === undefined) {
      return {
        status: -1,
        message:
          "Failed to reauthenticate: there is no valid authentication present on the account.",
      };
    }

    if (authMethod === "password") {
      if (options.password === undefined) {
        return {
          status: -1,
          message: "Failed to reauthenticate using password: password missing.",
        };
      }
      const credential = EmailAuthProvider.credential(
        user.email as string,
        options.password
      );
      await reauthenticateWithCredential(user, credential);
    } else {
      const authProvider =
        authMethod === "github.com"
          ? AccountController.githubProvider
          : AccountController.gmailProvider;
      await reauthenticateWithPopup(user, authProvider);
    }

    return {
      status: 1,
      message: "Reauthenticated",
      user,
    };
  } catch (e) {
    const typedError = e as FirebaseError;
    if (typedError.code === "auth/wrong-password") {
      return {
        status: 0,
        message: "Incorrect password",
      };
    } else {
      return {
        status: -1,
        message:
          "Failed to reauthenticate: " +
          (typedError?.message ?? JSON.stringify(e)),
      };
    }
  }
}

list.updateEmail = new SimpleModal({
  id: "updateEmail",
  title: "Update email",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
    {
      type: "text",
      placeholder: "New email",
      initVal: "",
    },
    {
      type: "text",
      placeholder: "Confirm new email",
      initVal: "",
    },
  ],
  buttonText: "update",
  onlineOnly: true,
  execFn: async (
    _thisPopup,
    password,
    email,
    emailConfirm
  ): Promise<ExecReturn> => {
    if (email !== emailConfirm) {
      return {
        status: 0,
        message: "Emails don't match",
      };
    }

    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.updateEmail(
      email,
      reauth.user.email as string
    );

    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update email: " + response.message,
      };
    }

    AccountController.signOut();

    return {
      status: 1,
      message: "Email updated",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
});

list.removeGoogleAuth = new SimpleModal({
  id: "removeGoogleAuth",
  title: "Remove Google authentication",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  onlineOnly: true,
  buttonText: "remove",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({
      password,
      excludeMethod: "google.com",
    });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      await unlink(reauth.user, "google.com");
    } catch (e) {
      const message = createErrorMessage(e, "Failed to unlink Google account");
      return {
        status: -1,
        message,
      };
    }

    Settings.updateAuthSections();

    reloadAfter(3);
    return {
      status: 1,
      message: "Google authentication removed",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      if (!isUsingGithubAuthentication()) {
        thisPopup.buttonText = "";
        thisPopup.text = "Password or GitHub authentication is not enabled";
      }
    }
  },
});

list.removeGithubAuth = new SimpleModal({
  id: "removeGithubAuth",
  title: "Remove GitHub authentication",
  inputs: [
    {
      placeholder: "Password",
      type: "password",
      initVal: "",
    },
  ],
  onlineOnly: true,
  buttonText: "remove",
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({
      password,
      excludeMethod: "github.com",
    });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      await unlink(reauth.user, "github.com");
    } catch (e) {
      const message = createErrorMessage(e, "Failed to unlink GitHub account");
      return {
        status: -1,
        message,
      };
    }

    Settings.updateAuthSections();

    reloadAfter(3);
    return {
      status: 1,
      message: "GitHub authentication removed",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      if (!isUsingGoogleAuthentication()) {
        thisPopup.buttonText = "";
        thisPopup.text = "Password or Google authentication is not enabled";
      }
    }
  },
});

list.removePasswordAuth = new SimpleModal({
  id: "removePaswordAuth",
  title: "Remove Password authentication",
  inputs: [
    {
      type: "checkbox",
      label: `I understand I will lose access to my Monkeytype account if my Google/GitHub account is lost or disabled.`,
    },
  ],
  onlineOnly: true,
  buttonText: "reauthenticate to remove",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    const reauth = await reauthenticate({
      excludeMethod: "password",
    });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      await unlink(reauth.user, "password");
    } catch (e) {
      const message = createErrorMessage(
        e,
        "Failed to remove password authentication"
      );
      return {
        status: -1,
        message,
      };
    }

    Settings.updateAuthSections();

    reloadAfter(3);
    return {
      status: 1,
      message: "Password authentication removed",
    };
  },
  beforeInitFn: (): void => {
    if (!isAuthenticated()) return;
  },
});

list.updateName = new SimpleModal({
  id: "updateName",
  title: "Update name",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "new name",
      type: "text",
      initVal: "",
    },
  ],
  buttonText: "update",
  onlineOnly: true,
  execFn: async (_thisPopup, password, newName): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const checkNameResponse = await Ape.users.getNameAvailability(newName);

    if (checkNameResponse.status === 409) {
      return {
        status: 0,
        message: "Name not available",
      };
    } else if (checkNameResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to check name: " + checkNameResponse.message,
      };
    }

    const updateNameResponse = await Ape.users.updateName(newName);
    if (updateNameResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to update name: " + updateNameResponse.message,
      };
    }

    const snapshot = DB.getSnapshot();
    if (snapshot) {
      snapshot.name = newName;
      if (snapshot.needsToChangeName) {
        reloadAfter(2);
      }
    }
    $("nav .textButton.account .text").text(newName);

    return {
      status: 1,
      message: "Name updated",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;
    if (!isUsingPasswordAuthentication()) {
      (thisPopup.inputs[0] as PasswordInput).hidden = true;
      thisPopup.buttonText = "reauthenticate to update";
    }
    if (snapshot.needsToChangeName === true) {
      thisPopup.text =
        "You need to change your account name. This might be because you have a duplicate name, no account name or your name is not allowed (contains whitespace or invalid characters). Sorry for the inconvenience.";
    }
  },
});

list.updatePassword = new SimpleModal({
  id: "updatePassword",
  title: "Update password",
  inputs: [
    {
      placeholder: "current password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "new password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "confirm new password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "update",
  onlineOnly: true,
  execFn: async (
    _thisPopup,
    previousPass,
    newPass,
    newPassConfirm
  ): Promise<ExecReturn> => {
    if (newPass !== newPassConfirm) {
      return {
        status: 0,
        message: "New passwords don't match",
      };
    }

    if (newPass === previousPass) {
      return {
        status: 0,
        message: "New password must be different from previous password",
      };
    }

    if (!isDevEnvironment() && !isPasswordStrong(newPass)) {
      return {
        status: 0,
        message:
          "New password must contain at least one capital letter, number, a special character and must be between 8 and 64 characters long",
      };
    }

    const reauth = await reauthenticate({ password: previousPass });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.updatePassword(newPass);

    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update password: " + response.message,
      };
    }

    AccountController.signOut();

    return {
      status: 1,
      message: "Password updated",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "";
      thisPopup.text = "Password authentication is not enabled";
    }
  },
});

list.addPasswordAuth = new SimpleModal({
  id: "addPasswordAuth",
  title: "Add password authentication",
  inputs: [
    {
      placeholder: "email",
      type: "email",
      initVal: "",
    },
    {
      placeholder: "confirm email",
      type: "email",
      initVal: "",
    },
    {
      placeholder: "new password",
      type: "password",
      initVal: "",
    },
    {
      placeholder: "confirm new password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "reauthenticate to add",
  onlineOnly: true,
  execFn: async (
    _thisPopup,
    email,
    emailConfirm,
    password,
    passConfirm
  ): Promise<ExecReturn> => {
    if (email !== emailConfirm) {
      return {
        status: 0,
        message: "Emails don't match",
      };
    }

    if (password !== passConfirm) {
      return {
        status: 0,
        message: "Passwords don't match",
      };
    }

    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(reauth.user, credential);
    } catch (e) {
      const message = createErrorMessage(
        e,
        "Failed to add password authentication"
      );
      return {
        status: -1,
        message,
      };
    }

    const response = await Ape.users.updateEmail(
      email,
      reauth.user.email as string
    );
    if (response.status !== 200) {
      return {
        status: -1,
        message:
          "Password authentication added but updating the database email failed. This shouldn't happen, please contact support. Error: " +
          response.message,
      };
    }

    Settings.updateAuthSections();
    return {
      status: 1,
      message: "Password authentication added",
    };
  },
});

list.deleteAccount = new SimpleModal({
  id: "deleteAccount",
  title: "Delete account",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "This is the last time you can change your mind. After pressing the button everything is gone.",
  buttonText: "delete",
  onlineOnly: true,
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Deleting all data...", 0);
    const usersResponse = await Ape.users.delete();

    if (usersResponse.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete user data: " + usersResponse.message,
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Account deleted, goodbye",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to delete";
    }
  },
});

list.resetAccount = new SimpleModal({
  id: "resetAccount",
  title: "Reset account",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "This is the last time you can change your mind. After pressing the button everything is gone.",
  buttonText: "reset",
  onlineOnly: true,
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    Notifications.add("Resetting settings...", 0);
    await UpdateConfig.reset();

    Notifications.add("Resetting account...", 0);
    const response = await Ape.users.reset();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to reset account: " + response.message,
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Account reset",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to reset";
    }
  },
});

list.optOutOfLeaderboards = new SimpleModal({
  id: "optOutOfLeaderboards",
  title: "Opt out of leaderboards",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "Are you sure you want to opt out of leaderboards?",
  buttonText: "opt out",
  onlineOnly: true,
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.optOutOfLeaderboards();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to opt out: " + response.message,
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Leaderboards opt out successful",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to opt out";
    }
  },
});

list.clearTagPb = new SimpleModal({
  id: "clearTagPb",
  title: "Clear tag PB",
  text: "Are you sure you want to clear this tags PB?",
  buttonText: "clear",
  execFn: async (thisPopup): Promise<ExecReturn> => {
    const tagId = thisPopup.parameters[0] as string;
    const response = await Ape.users.deleteTagPersonalBest(tagId);
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to clear tag PB: " + response.message,
      };
    }

    const tag = DB.getSnapshot()?.tags?.filter((t) => t._id === tagId)[0];

    if (tag === undefined) {
      return {
        status: -1,
        message: "Tag not found",
      };
    }
    tag.personalBests = {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };
    $(
      `.pageSettings .section.tags .tagsList .tag[id="${tagId}"] .clearPbButton`
    ).attr("aria-label", "No PB found");
    return {
      status: 1,
      message: "Tag PB cleared",
    };
  },
  beforeInitFn: (thisPopup): void => {
    thisPopup.text = `Are you sure you want to clear PB for tag ${thisPopup.parameters[1]}?`;
  },
});

list.applyCustomFont = new SimpleModal({
  id: "applyCustomFont",
  title: "Custom font",
  inputs: [{ type: "text", placeholder: "Font name", initVal: "" }],
  text: "Make sure you have the font installed on your computer before applying",
  buttonText: "apply",
  execFn: async (_thisPopup, fontName): Promise<ExecReturn> => {
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));

    return {
      status: 1,
      message: "Font applied",
    };
  },
});

list.resetPersonalBests = new SimpleModal({
  id: "resetPersonalBests",
  title: "Reset personal bests",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  buttonText: "reset",
  onlineOnly: true,
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.deletePersonalBests();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to reset personal bests: " + response.message,
      };
    }

    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return {
        status: -1,
        message: "Failed to reset personal bests: no snapshot",
      };
    }

    snapshot.personalBests = {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };

    return {
      status: 1,
      message: "Personal bests reset",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    if (!isUsingPasswordAuthentication()) {
      thisPopup.inputs = [];
      thisPopup.buttonText = "reauthenticate to reset";
    }
  },
});

list.resetSettings = new SimpleModal({
  id: "resetSettings",
  title: "Reset settings",
  text: "Are you sure you want to reset all your settings?",
  buttonText: "reset",
  onlineOnly: true,
  execFn: async (): Promise<ExecReturn> => {
    await UpdateConfig.reset();
    return {
      status: 1,
      message: "Settings reset",
    };
  },
});

list.revokeAllTokens = new SimpleModal({
  id: "revokeAllTokens",
  title: "Revoke all tokens",
  inputs: [
    {
      placeholder: "password",
      type: "password",
      initVal: "",
    },
  ],
  text: "Are you sure you want to this? This will log you out of all devices.",
  buttonText: "revoke all",
  onlineOnly: true,
  execFn: async (_thisPopup, password): Promise<ExecReturn> => {
    const reauth = await reauthenticate({ password });
    if (reauth.status !== 1) {
      return {
        status: reauth.status,
        message: reauth.message,
      };
    }

    const response = await Ape.users.revokeAllTokens();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to revoke tokens: " + response.message,
      };
    }

    reloadAfter(3);

    return {
      status: 1,
      message: "Tokens revoked",
    };
  },
  beforeInitFn: (thisPopup): void => {
    if (!isAuthenticated()) return;
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;
    if (!isUsingPasswordAuthentication()) {
      (thisPopup.inputs[0] as PasswordInput).hidden = true;
      thisPopup.buttonText = "reauthenticate to revoke all tokens";
    }
  },
});

list.unlinkDiscord = new SimpleModal({
  id: "unlinkDiscord",
  title: "Unlink Discord",
  text: "Are you sure you want to unlink your Discord account?",
  buttonText: "unlink",
  onlineOnly: true,
  execFn: async (): Promise<ExecReturn> => {
    const snap = DB.getSnapshot();
    if (!snap) {
      return {
        status: -1,
        message: "Failed to unlink Discord: no snapshot",
      };
    }

    const response = await Ape.users.unlinkDiscord();
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to unlink Discord: " + response.message,
      };
    }

    snap.discordAvatar = undefined;
    snap.discordId = undefined;
    void AccountButton.update();
    DB.setSnapshot(snap);
    Settings.updateDiscordSection();

    return {
      status: 1,
      message: "Discord unlinked",
    };
  },
});

list.generateApeKey = new SimpleModal({
  id: "generateApeKey",
  title: "Generate new Ape key",
  inputs: [
    {
      type: "text",
      placeholder: "Name",
      initVal: "",
    },
  ],
  buttonText: "generate",
  onlineOnly: true,
  execFn: async (_thisPopup, name): Promise<ExecReturn> => {
    const response = await Ape.apeKeys.generate(name, false);
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to generate key: " + response.message,
      };
    }

    //if response is 200 data is guaranteed to not be null
    const data = response.data as Ape.ApeKeys.GenerateApeKey;

    const modalChain = modal.getPreviousModalInChain();
    return {
      status: 1,
      message: "Key generated",
      hideOptions: {
        clearModalChain: true,
        animationMode: "modalOnly",
      },
      afterHide: (): void => {
        showPopup("viewApeKey", [data.apeKey], {
          modalChain,
          animationMode: "modalOnly",
        });
      },
    };
  },
});

list.viewApeKey = new SimpleModal({
  id: "viewApeKey",
  title: "Ape key",
  inputs: [
    {
      type: "textarea",
      disabled: true,
      placeholder: "key",
      initVal: "",
    },
  ],
  text: "This is your new Ape Key. Please keep it safe. You will only see it once!",
  buttonText: "close",
  hideCallsExec: true,
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    return {
      status: 1,
      message: "Key generated",
      showNotification: false,
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
  beforeInitFn: (_thisPopup): void => {
    (_thisPopup.inputs[0] as TextArea).initVal = _thisPopup
      .parameters[0] as string;
  },
  beforeShowFn: (_thisPopup): void => {
    _thisPopup.canClose = false;
    $("#simpleModal textarea").css("height", "110px");
    $("#simpleModal .submitButton").addClass("hidden");
    setTimeout(() => {
      _thisPopup.canClose = true;
      $("#simpleModal .submitButton").removeClass("hidden");
    }, 5000);
  },
});

list.deleteApeKey = new SimpleModal({
  id: "deleteApeKey",
  title: "Delete Ape key",
  text: "Are you sure?",
  buttonText: "delete",
  onlineOnly: true,
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    const response = await Ape.apeKeys.delete(_thisPopup.parameters[0] ?? "");
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete key: " + response.message,
      };
    }

    return {
      status: 1,
      message: "Key deleted",
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
});

list.editApeKey = new SimpleModal({
  id: "editApeKey",
  title: "Edit Ape key",
  inputs: [
    {
      type: "text",
      placeholder: "name",
      initVal: "",
    },
  ],
  buttonText: "edit",
  onlineOnly: true,
  execFn: async (_thisPopup, input): Promise<ExecReturn> => {
    const response = await Ape.apeKeys.update(_thisPopup.parameters[0] ?? "", {
      name: input,
    });
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update key: " + response.message,
      };
    }
    return {
      status: 1,
      message: "Key updated",
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
});

list.deleteCustomText = new SimpleModal({
  id: "deleteCustomText",
  title: "Delete custom text",
  text: "Are you sure?",
  buttonText: "delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, false);
    CustomTextState.setCustomTextName("", undefined);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.deleteCustomTextLong = new SimpleModal({
  id: "deleteCustomTextLong",
  title: "Delete custom text",
  text: "Are you sure?",
  buttonText: "delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, true);
    CustomTextState.setCustomTextName("", undefined);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.resetProgressCustomTextLong = new SimpleModal({
  id: "resetProgressCustomTextLong",
  title: "Reset progress for custom text",
  text: "Are you sure?",
  buttonText: "reset",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.setCustomTextLongProgress(_thisPopup.parameters[0] as string, 0);
    const text = CustomText.getCustomText(
      _thisPopup.parameters[0] as string,
      true
    );
    CustomText.setText(text);
    return {
      status: 1,
      message: "Custom text progress reset",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to reset your progress for custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.updateCustomTheme = new SimpleModal({
  id: "updateCustomTheme",
  title: "Update custom theme",
  inputs: [
    {
      type: "text",
      placeholder: "name",
      initVal: "",
    },
    {
      type: "checkbox",
      initVal: false,
      label: "Update custom theme to current colors",
      optional: true,
    },
  ],
  buttonText: "update",
  onlineOnly: true,
  execFn: async (_thisPopup, name, updateColors): Promise<ExecReturn> => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return {
        status: -1,
        message: "Failed to update custom theme: no snapshot",
      };
    }

    const customTheme = snapshot.customThemes?.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (customTheme === undefined) {
      return {
        status: -1,
        message: "Failed to update custom theme: theme not found",
      };
    }

    let newColors: string[] = [];
    if (updateColors === "true") {
      for (const color of ThemeController.colorVars) {
        newColors.push(
          $(
            `.pageSettings .customTheme .customThemeEdit #${color}[type='color']`
          ).attr("value") as string
        );
      }
    } else {
      newColors = customTheme.colors;
    }

    const newTheme = {
      name: name.replaceAll(" ", "_"),
      colors: newColors,
    };
    const validation = await DB.editCustomTheme(customTheme._id, newTheme);
    if (!validation) {
      return {
        status: -1,
        message: "Failed to update custom theme",
      };
    }
    UpdateConfig.setCustomThemeColors(newColors);
    void ThemePicker.refreshButtons();

    return {
      status: 1,
      message: "Custom theme updated",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;

    const customTheme = snapshot.customThemes?.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (!customTheme) return;
    (_thisPopup.inputs[0] as TextInput).initVal = customTheme.name;
  },
});

list.deleteCustomTheme = new SimpleModal({
  id: "deleteCustomTheme",
  title: "Delete custom theme",
  text: "Are you sure?",
  buttonText: "delete",
  onlineOnly: true,
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    await DB.deleteCustomTheme(_thisPopup.parameters[0] as string);
    void ThemePicker.refreshButtons();

    return {
      status: 1,
      message: "Custom theme deleted",
    };
  },
});

list.forgotPassword = new SimpleModal({
  id: "forgotPassword",
  title: "Forgot password",
  inputs: [
    {
      type: "text",
      placeholder: "email",
      initVal: "",
    },
  ],
  buttonText: "send",
  execFn: async (_thisPopup, email): Promise<ExecReturn> => {
    const result = await Ape.users.forgotPasswordEmail(email.trim());
    if (result.status !== 200) {
      return {
        status: -1,
        message: "Failed to send password reset email: " + result.message,
      };
    }

    return {
      status: 1,
      message: result.message,
      notificationOptions: {
        duration: 8,
      },
    };
  },
  beforeInitFn: (thisPopup): void => {
    const inputValue = $(
      `.pageLogin .login input[name="current-email"]`
    ).val() as string;
    if (inputValue) {
      (thisPopup.inputs[0] as TextInput).initVal = inputValue;
    }
  },
});

list.devGenerateData = new SimpleModal({
  id: "devGenerateData",
  title: "Generate data",
  showLabels: true,
  inputs: [
    {
      type: "text",
      label: "username",
      placeholder: "username",
      oninput: (event): void => {
        const target = event.target as HTMLInputElement;
        const span = document.querySelector(
          "#devGenerateData_1 + span"
        ) as HTMLInputElement;
        span.innerHTML = `if checked, user will be created with ${target.value}@example.com and password: password`;
        return;
      },
    },
    {
      type: "checkbox",
      label: "create user",
      description:
        "if checked, user will be created with {username}@example.com and password: password",
      optional: true,
    },
    {
      type: "date",
      label: "first test",
      optional: true,
    },
    {
      type: "date",
      label: "last test",
      max: new Date(),
      optional: true,
    },
    {
      type: "range",
      label: "min tests per day",
      initVal: 0,
      min: 0,
      max: 200,
      step: 10,
    },
    {
      type: "range",
      label: "max tests per day",
      initVal: 50,
      min: 0,
      max: 200,
      step: 10,
    },
  ],
  buttonText: "generate (might take a while)",
  execFn: async (
    _thisPopup,
    username,
    createUser,
    firstTestTimestamp,
    lastTestTimestamp,
    minTestsPerDay,
    maxTestsPerDay
  ): Promise<ExecReturn> => {
    const request: Ape.Dev.GenerateData = {
      username,
      createUser: createUser === "true",
    };
    if (firstTestTimestamp !== undefined && firstTestTimestamp.length > 0)
      request.firstTestTimestamp = Date.parse(firstTestTimestamp);
    if (lastTestTimestamp !== undefined && lastTestTimestamp.length > 0)
      request.lastTestTimestamp = Date.parse(lastTestTimestamp);
    if (minTestsPerDay !== undefined && minTestsPerDay.length > 0)
      request.minTestsPerDay = Number.parseInt(minTestsPerDay);
    if (maxTestsPerDay !== undefined && maxTestsPerDay.length > 0)
      request.maxTestsPerDay = Number.parseInt(maxTestsPerDay);

    const result = await Ape.dev.generateData(request);

    return {
      status: result.status === 200 ? 1 : -1,
      message: result.message,
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
});
export function showPopup(
  key: PopupKey,
  showParams = [] as string[],
  showOptions: ShowOptions = {}
): void {
  const popup = list[key];
  if (popup === undefined) {
    Notifications.add("Failed to show popup - popup is not defined", -1);
    return;
  }
  if (popup.onlineOnly === true && !ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  popup.show(showParams, showOptions);
}

//todo: move these event handlers to their respective files (either global event files or popup files)
$(".pageLogin #forgotPasswordButton").on("click", () => {
  showPopup("forgotPassword");
});

$(".pageSettings .section.discordIntegration #unlinkDiscordButton").on(
  "click",
  () => {
    showPopup("unlinkDiscord");
  }
);

$(".pageSettings #removeGoogleAuth").on("click", () => {
  showPopup("removeGoogleAuth");
});

$(".pageSettings #removeGithubAuth").on("click", () => {
  showPopup("removeGithubAuth");
});
$(".pageSettings #removePasswordAuth").on("click", () => {
  showPopup("removePasswordAuth");
});

$("#resetSettingsButton").on("click", () => {
  showPopup("resetSettings");
});

$("#revokeAllTokens").on("click", () => {
  showPopup("revokeAllTokens");
});

$(".pageSettings #resetPersonalBestsButton").on("click", () => {
  showPopup("resetPersonalBests");
});

$(".pageSettings #updateAccountName").on("click", () => {
  showPopup("updateName");
});

$("#bannerCenter").on("click", ".banner .text .openNameChange", () => {
  showPopup("updateName");
});

$(".pageSettings #addPasswordAuth").on("click", () => {
  showPopup("addPasswordAuth");
});

$(".pageSettings #emailPasswordAuth").on("click", () => {
  showPopup("updateEmail");
});

$(".pageSettings #passPasswordAuth").on("click", () => {
  showPopup("updatePassword");
});

$(".pageSettings #deleteAccount").on("click", () => {
  showPopup("deleteAccount");
});

$(".pageSettings #resetAccount").on("click", () => {
  showPopup("resetAccount");
});

$(".pageSettings #optOutOfLeaderboardsButton").on("click", () => {
  showPopup("optOutOfLeaderboards");
});

$(".pageSettings").on(
  "click",
  ".section.themes .customTheme .delButton",
  (e) => {
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    showPopup("deleteCustomTheme", [customThemeId]);
  }
);

$(".pageSettings").on(
  "click",
  ".section.themes .customTheme .editButton",
  (e) => {
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    showPopup("updateCustomTheme", [customThemeId], {
      focusFirstInput: "focusAndSelect",
    });
  }
);

$(".pageSettings").on(
  "click",
  ".section[data-config-name='fontFamily'] button[data-config-value='custom']",
  () => {
    showPopup("applyCustomFont");
  }
);
