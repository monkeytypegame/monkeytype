### **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Adding fonts](#adding-fonts)
- [Committing Languages](#committing-languages)
- [Language Guidelines](#language-guidelines)

### Forking Monkeytype

First, you will have to make a personal copy of the Monkeytype repository, also known as "forking". Go to the [Monkeytype repo](https://github.com/monkeytypegame/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screenshot showing location of the fork button on GitHub." src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Adding Fonts

Once you have forked the repository you can now add your font. Place the font file in  `./frontend/static/webfonts` e.g.  `My-Font.woff2`.

> [!NOTE]
> Your font needs to be in the `.woff2` format. Your filename cannot include spaces or start with a number.

Open `./packages/schemas/src/fonts.ts` and add the new font at the _end_ of the `KnownFontNameSchema` list like this:

```typescript
const KnownFontNameSchema = z.enum(
  [
    "Roboto_Mono",
    "Noto_Naskh_Arabic",
    ...
    "My_Font",
```

Call it whatever you want but make sure you replace spaces with underscores and the font does not start with a number. 

Then, go to `./frontend/src/ts/constants/fonts.ts` and add the following code to the _end_ of the `Fonts` object near to the very end of the file:

```typescript
export const Fonts: Record<KnownFontName, FontConfig> = {
  ...
  My_Font: {
    fileName:  "My-Font.woff2",
  }
```

### Committing Languages

Once you have created your language, you now need to create a pull request to the main Monkeytype repository. Go to the branch where you created your languages on GitHub. Then make sure your branch is up to date. Once it is up to date, click "contribute".

Update branch:
<img width="1552" alt="Screenshot showing how to update the fork to match the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screenshot showing how to create a pull request to the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

## Language Guidelines

Make sure your language follows the [Language guidelines](./CONTRIBUTING.md#language-guidelines).

