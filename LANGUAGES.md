### **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Creating Languages](#creating-langauges)
- [Commiting Langauges](#commiting-languages)
- [Language Guidelines](#language-guidelines)

### Forking Monkeytype

First you will have to copy the Monkeytype repository also known as forking. Go to the [Monkeytype Repo](https://github.com/Miodec/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screen Shot 2022-01-12 at 11 51 49 AM" src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Creating Langauges

Once you have forked the repository you can now add your langauge. (If you haven't already forked the repository, refer to this [section](#forking-the-repository).) Create a file in `./frontend/static/languages/`. Create a json file with the language name and the amount of words. e.g `language_1k.json`. The minimum amount of words needed are 200 and if that is the amount of words you chose to add then ignore the `_1k` part of the name. Otherwise the name should look something like this: `language_1k.json`. The inside of the file should look like this:

```
{
  "name": "language",
  "leftToRight": true,
  "bcp47": "es-ES",
  "words": [
    "words",
  ]
}
```

(It is recommended that you familiarize yourselves with JSON before adding a language.) For the name varible put the name of your language. Left to right indicates how the language is written. If it is written left to right then put `true` otherwise put false. For bcp47 put your languages IETF language tag. (For more information about the IETF language tag refer to [here]("https://en.wikipedia.org/wiki/IETF_language_tag").) But you aren't done just yet. You need to add your language to the `_groups.json` and `_list.json` files.
Add the name of the language to the `_groups.json` file like so:

```
{
     "name": "language",
     "languages": ["language"]
}
```

And add your language to the `_list.json` file like so:

```
,"spanish"
,"spanish_1k"
,"spanish_10k"
,"YOUR_LANGUAGE"
,"french"
,"french_1k"
,"french_2k"
```

### Commiting Languages

Once you have created your language you now need to create a pull request on the main Monkeytype repository. Go to the branch where you created your languages on GitHub.
Then make sure your branch is up to date. Once it is up to date click contribute.

Update branch:
<img width="1552" alt="Screen Shot 2022-01-12 at 10 55 19 AM" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screen Shot 2022-01-12 at 10 56 42 AM" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

## Language Guidelines

Make sure your language follows the language guidelines.
[Language guidelines](https://github.com/Miodec/monkeytype/blob/master/CONTRIBUTING.md#language-guidelines)
