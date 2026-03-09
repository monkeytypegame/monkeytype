# Review: solid-login branch

**Branch**: `solid-login`
**Scope**: Migrates login page from vanilla JS to SolidJS (net -56 lines)

## Issues

### 1. Eager evaluation in `Conditional` component
`Conditional` receives `then`/`else` as JSXElement props — both branches are evaluated eagerly. In `LoginPage.tsx`, this means the full Register+Login forms render even when sign-up is disabled, and vice versa. Same issue in `Separator` with the `text` prop variant.
**Fix**: Use `<Show>` directly with children/fallback, or wrap in thunks.

### 2. Duplicate provider sign-in handlers (Login.tsx)
`handleSignInWithGoogle` and `handleSignInWithGitHub` are nearly identical. Extract a shared helper parameterized by provider function and name.

### 3. Inline style instead of Tailwind (Login.tsx)
`style={{ "justify-content": "right" }}` on "forgot password?" button — use `class="justify-end"`.

### 4. Raw Firebase error codes exposed to users (firebase.ts)
The new catch-all `else { message = "Firebase error: " + error.code; }` surfaces raw codes. Consider friendly messages or a generic fallback.

### 5. Popup-closed / user-cancelled now show error notifications
Previously silenced. Now "Failed to sign in with Google: Popup closed by user" appears as error. Intentional? May confuse users who deliberately closed the popup.

### 6. emailVerifyValid stale when email changes (Register.tsx)
Verify-email validity callback runs `setEmailVerifyValid(emailValid() && result.success)` only when verify field changes. Changing the email field won't trigger revalidation of the verify field. Pre-existing behavior, but worth fixing during migration.

### 7. Module-level mutable state for disposable email module (Register.tsx)
`disposableEmailModule` and `moduleLoadAttempted` are module singletons. Fragile if component mounts multiple times (storybook). Consider lazy signal or component-scoped state.

### 8. `disabled` missing from `splitProps` exclusion list (ValidatedInput.tsx)
`disabled` is used in JSX but not excluded in `splitProps`, so it also leaks into `ValidatedHtmlInputElement` via `others`.

## Minor

- `oxlint-disable-next-line react/no-unknown-property` for `autocomplete` — consider global disable for `.tsx` in Solid project.
- Hardcoded `w-68` on inputs — consider responsive approach.
- `resetForm()` name suggests resetting field values, but only resets loader/input-enabled state.

## What's Good

- Clean store pattern with `createSignalWithSetters`.
- Server config query replaces imperative DOM manipulation for sign-up disabled check.
- Clean removal of vanilla JS login page, styles, and event handlers.
- `google-sign-up.ts` properly migrated to import from new store.
