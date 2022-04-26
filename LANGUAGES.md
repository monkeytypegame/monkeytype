## **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Creating Languages](#creating-languages)
- [Committing Languages](#committing-languages)
- [Language Guidelines](#language-guidelines)

## Forking Monkeytype

First, you will have to fork. Go to the [Monkeytype repo](https://github.com/Miodec/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screenshot showing location of the fork button on GitHub." src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Creating Languages

Once you have forked the repository, you can add your new language. Create a new JSON file in `./frontend/static/languages/`, named as the language name and the number of words, for example: `language_1k.json`. If there are less than 1,000 words, name the file after the language (e.g. `language.json`). Note that a minimum of 200 words are required.

The contents of the file should be as follows:

```
{
  "name": "language",
  "leftToRight": true,
  "ligatures": true,
  "bcp47": "es-ES",
  "words": [
    "words",
  ]
}
```

We recommend that you familiarize yourself with JSON before adding a language. For the `name` field, put the name of your new language. `leftToRight` indicates how the language was written. If it was written from left to right, put `true`, otherwise put `false`.
A ligature occurs when multiple letters join together to form a character [more details](https://en.wikipedia.org/wiki/Ligature_(writing)). If there's joining in the words (like in Arabic), set the `ligatures` value to `true`, otherwise put `false`. For `bcp47` put your languages [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag). Finally, add your list of words to the `words` field.

In addition to the language file, you need to add it to the `_groups.json` and `_list.json` files in the same directory. Add the name of the language to the `_groups.json` file like so:

```
{
  "name": "spanish",
  "languages": ["spanish", "spanish_1k", "spanish_10k"]
},
{
  "name": "YOUR_LANGUAGE",
  "languages": ["YOUR_LANGUAGES"]
},
{
  "name": "french",
  "languages": ["french", "french_1k", "french_2k", "french_10k"]
},
```

The `languages` field is the list of files you have created for your language (without the `.json` file extension). Add all of your files if you have created multiple word lists of differing lengths in the same language.

Add your language lists to the `_list.json` file like so:

```
,"spanish"
,"spanish_1k"
,"spanish_10k"
,"YOUR_LANGUAGE"
,"french"
,"french_1k"
,"french_2k"
```

## Committing Languages

After creating your language, you need to create a pull request to the Monkeytype repository. Locate the branch that contains your new language(s) on GitHub. Then make sure it is up to date. Once it is up to date, click "contribute".

Update branch:
<img width="1552" alt="Screenshot showing how to update the fork to match the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screenshot showing how to create a pull request to the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

## Language Guidelines

Make sure your language follows the language guidelines.
[Language guidelines](https://github.com/Miodec/monkeytype/blob/master/CONTRIBUTING.md#language-guidelines)
