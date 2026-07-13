import { UserNameSchema } from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";
import {
  getAdditionalUserInfo,
  sendEmailVerification,
  updateProfile,
  UserCredential,
} from "firebase/auth";

import Ape from "../../ape";
import { loadUser, signOut } from "../../auth";
import { authEvent } from "../../events/auth";
import { googleSignUpEvent } from "../../events/google-sign-up";
import { resetIgnoreAuthCallback, setUserState } from "../../firebase";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal, ModalId, showModal } from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { remoteValidationForm } from "../../utils/remote-validation";
import { AnimatedModal } from "../common/AnimatedModal";
import { Captcha } from "../ui/form/Captcha";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { allFieldsMandatory, fromSchema } from "../ui/form/utils";

const modalId: ModalId = "GoogleSignup";
let signedInUser: UserCredential | undefined = undefined;

export function GoogleSignupModal() {
  const form = createForm(() => ({
    defaultValues: {
      username: "",
      captcha: "",
    },
    onSubmit: async ({ value }) => apply(value),
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  return (
    <AnimatedModal
      id={modalId}
      title="Account name"
      mode="dialog"
      afterHide={() => void afterHide()}
    >
      <p>Please enter a username before continuing</p>
      <form
        class="flex flex-col justify-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="username"
          validators={{
            onChange: fromSchema(UserNameSchema),
            onChangeAsyncDebounceMs: 1000,
            onChangeAsync: remoteValidationForm(
              async (name: string) =>
                Ape.users.getNameAvailability({ params: { name } }),
              { check: (data) => data.available || "Name not available" },
            ),
          }}
          children={(field) => (
            <InputField field={field} placeholder="username" type="input" />
          )}
        />
        <form.Field
          name="captcha"
          children={(field) => (
            <Captcha
              field={field}
              class="flex w-full flex-row justify-center"
            />
          )}
        />

        <SubmitButton form={form} text="continue" />
      </form>
    </AnimatedModal>
  );
}

async function afterHide(): Promise<void> {
  resetIgnoreAuthCallback();
  if (signedInUser !== undefined) {
    showNoticeNotification("Sign up process cancelled", {
      durationMs: 5000,
    });
    if (getAdditionalUserInfo(signedInUser)?.isNewUser) {
      await Ape.users.delete();
      await signedInUser?.user.delete().catch(() => {
        //user might be deleted already by the server
      });
    }
    signOut();
    signedInUser = undefined;
  }
}
async function apply(options: {
  username: string;
  captcha: string;
}): Promise<void> {
  const { username: name, captcha } = options;
  if (!signedInUser) {
    showErrorNotification(
      "Missing user credential. Please close the popup and try again.",
    );
    return;
  }
  if (!captcha) {
    showNoticeNotification("Please complete the captcha");
    return;
  }

  showLoaderBar();
  try {
    if (name.length === 0) throw new Error("Name cannot be empty");
    const response = await Ape.users.create({ body: { name, captcha } });
    if (response.status !== 200) {
      throw new Error(`Failed to create user: ${response.body.message}`);
    }

    setUserState(signedInUser.user);
    await updateProfile(signedInUser.user, { displayName: name });
    await sendEmailVerification(signedInUser.user);
    showSuccessNotification("Account created");
    await loadUser(signedInUser.user);

    authEvent.dispatch({
      type: "authStateChanged",
      data: { isUserSignedIn: true, loadPromise: Promise.resolve() },
    });
    signedInUser = undefined;
  } catch (e) {
    console.log(e);
    showErrorNotification("Failed to sign in with Google", { error: e });
    if (signedInUser && getAdditionalUserInfo(signedInUser)?.isNewUser) {
      await Ape.users.delete();
      await signedInUser?.user.delete().catch(() => {
        //user might be deleted already by the server
      });
    }
    signOut();
    signedInUser = undefined;
  } finally {
    hideLoaderBar();
    hideModal(modalId);
  }
}

googleSignUpEvent.subscribe((data) => {
  if (data.signedInUser !== undefined && data.isNewUser) {
    signedInUser = data.signedInUser;
    showModal(modalId);
  }
});
