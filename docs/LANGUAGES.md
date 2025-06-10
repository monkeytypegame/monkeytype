### **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Creating Languages](#creating-languages)
- [Committing Languages](#committing-languages)
- [Language Guidelines](#language-guidelines)

### Forking Monkeytype

First, you will have to make a personal copy of the Monkeytype repository, also known as "forking". Go to the [Monkeytype repo](https://github.com/monkeytypegame/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screenshot showing location of the fork button on GitHub." src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Creating Languages

Once you have forked the repository you can now add your language. Create a new JSON file in `./frontend/static/languages/`, named as the language name and the number of words, e.g. `language_1k.json`. If there are less than 1,000 words, simply name the file after the language (e.g. `language.json`). Note that a minimum of 200 words are required.

The contents of the file should be as follows:

```json
{
  "name": string,
  "rightToLeft": boolean,
  "ligatures": boolean,
  "orderedByFrequency": boolean,
  "bcp47": string,
  "words": string[]
}
```

It is recommended that you familiarize yourselves with JSON before adding a language. For the `name` field, put the name of your language. `rightToLeft` indicates how the language is written. If it is written right to left then put `true`, otherwise put `false`.
`ligatures` A ligature occurs when multiple letters are joined together to form a character [more details](<https://en.wikipedia.org/wiki/Ligature_(writing)>). If there's joining in the words, which is the case in languages like (Arabic, Malayalam, Persian, Sanskrit, Central_Kurdish... etc.), then set the value to `true`, otherwise set it to `false`. For `bcp47` put your languages [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag). If the words you're adding are ordered by frequency (most common words at the top, least at the bottom) set the value of `orderedByFrequency` to `true`, otherwise `false`.  Finally, add your list of words to the `words` field.

Then, go to `packages/contracts/src/schemas/languages.ts` and add your new language name at the _end_ of the `LanguageSchema` enum. Make sure to end the line with a comma.  Make sure to add all your language names if you have created multiple word lists of differing lengths in the same language.

```typescript
export const LanguageSchema = z.enum([
  "english",
  "english_1k",
  ...
  "your_language_name",
  "your_language_name_10k",
]);
```

Then, go to `frontend/src/ts/constants/language.ts` and add your new language name to the `LanguageGroups` map. You can either add it to an existing group or add a new one.  Make sure to add all your language names if you have created multiple word lists of differing lengths in the same language.

```typescript
export const LanguageGroups: Record<string, Language[]> = {
  ...
  your_language_name: [
    "your_language_name",
    "your_language_name_10k",
  ]
};
```

### Committing Languages

Once you have created your language, you now need to create a pull request to the main Monkeytype repository. Go to the branch where you created your languages on GitHub. Then make sure your branch is up to date. Once it is up to date, click "contribute".

Update branch:
<img width="1552" alt="Screenshot showing how to update the fork to match the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screenshot showing how to create a pull request to the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

## Language Guidelines

Make sure your language follows the [Language guidelines](./CONTRIBUTING.md#language-guidelines).

