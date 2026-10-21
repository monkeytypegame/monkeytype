# 02 — Letter icons via `Fa` (`getLetterIcon`)

Status: open
Blocked by: 01

## What
See spec "Funbox".
- Add funbox function `getLetterIcon(char) → icon name | undefined`; implement for the arrows funbox.
- `Words` renders tab, newline and funbox-icon letters through the `Fa` component, matching current markup classes (`tabChar`, `nlChar`).
- Keep `getWordHtml` for now (old renderer still uses it); 03 deletes it.

## Acceptance
- Seam tests: tab/newline icons; arrows funbox active → arrow icons; typed icon letters keep correct/incorrect classes.
