### **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Creating Layouts](#creating-layouts  )
- [Committing Layouts](#committing-layouts)

### Forking Monkeytype

First, you will have to make a personal copy of the Monkeytype repository, also known as "forking". Go to the [Monkeytype repo](https://github.com/monkeytypegame/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screenshot showing location of the fork button on GitHub." src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Creating Layouts

Once you have forked the repository you can now add your layout. Create a new JSON file in `./frontend/static/layouts/`, named as the layout name, e.g. `qwerty.json`.

The contents of the file should be as follows:

```json
{
  "keymapShowTopRow": false,
  "type": "ansi",
  "keys": {
    "row1": ["`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+"],
    "row2": ["qQ", "wW", "eE", "rR", "tT", "yY", "uU", "iI", "oO", "pP", "[{", "]}", "\\|"],
    "row3": ["aA", "sS", "dD", "fF", "gG", "hH", "jJ", "kK", "lL", ";:", "'\""],
    "row4": ["zZ", "xX", "cC", "vV", "bB", "nN", "mM", ",<", ".>", "/?"],
    "row5": [" "]
  }
}

```

It is recommended that you familiarize yourselves with JSON before adding a layout.

`keymapShowTopRow` indicates whether to always show the first row of the layout.
`type` can be `ansi` or  `iso`.

In `keys` you need to specify `row1` to  `row5`. Add the keys within the row as string. The string can have up to four character. The character define unshifted, shifted, alt-gr and shifted alt-gr character in this order. For example `eE€` defines `e` on regular key press, `E` if `shift` is held and `€` if `alt-gr` is held.

**Note:**  Quote and backslash characters need to be escaped: `\"` and `\\`.

For ansi layouts the number of keys need to be exactly thirteen for `row1` and `row2`, eleven for `row3`, ten for `row4` and one or two for `row5`.

For iso the number of keys need to be exactly thirteen for `row1`, twelve for `row2` and  `row3`, eleven for `row4` and one or two for `row5`.



In addition to the layout file you need to add your layout to the `packages/contracts/src/schemas/layouts.ts` file. Just append your layout name (without the `.json`) at the __end__ of the `LayoutNameSchema`. Remember to add a comma like this:

```ts
  export const LayoutNameSchema = z.enum([
    "qwerty",
    "dvorak",
    "colemak",
    ...
    "your_layout_name",
]);
``` 

### Committing Layouts

Once you have created your layout, you now need to create a pull request to the main Monkeytype repository. Go to the branch where you created your layout on GitHub. Then make sure your branch is up to date. Once it is up to date, click "contribute".

Update branch:
<img width="1552" alt="Screenshot showing how to update the fork to match the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screenshot showing how to create a pull request to the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

Make sure your PR title follow the syntax `feat(layout): add <YOUR_LAYOUT> layout (@<YOUR_GITHUB_NAME>)`, e.g. `feat(layout): add qwerty layout (@teddinotteddy)`

## Layout Guidelines

Make sure your layout follows the [Layout guidelines](./CONTRIBUTING.md#layout-guidelines).