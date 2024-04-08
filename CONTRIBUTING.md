# Contributing

### **Table of Contents**

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Standards and Guidelines](#standards-and-guidelines)
  - [Theme Guidelines](#theme-guidelines)
  - [Language Guidelines](#language-guidelines)
  - [Quote Guidelines](#quote-guidelines)
- [Questions](#questions)

## Getting Started

When contributing to Monkeytype, it's good to know our best practices, tips, and tricks. First, Monkeytype is written in ~~JavaScript~~ TypeScript, CSS, and HTML (in order of language usage within the project); thus, we assume you are comfortable with these languages or have basic knowledge of them. Our backend is in NodeJS and we use MongoDB to store our user data. Firebase is used for authentication. Redis is used to store ephemeral data (daily leaderboards, jobs via BullMQ, OAuth state parameters). Furthermore, we use Prettier to format our code.

## How to Contribute

We have two separate contribution guides based on what you're looking to contribute. If you're simply looking to help us augment our language or quotes data, please refer to [CONTRIBUTING_BASIC.md](./CONTRIBUTING_BASIC.md). This guide will go over how to do so easily and without the need to set up a local development server.

If you're looking to make deeper code changes that affect functionality, or will require screenshots of the changes, please refer to [CONTRIBUTING_ADVANCED.md](./CONTRIBUTING_ADVANCED.md).

## Standards and Guidelines

Below is a set of general guidelines for different types of changes.

### Pull Request Naming Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for our pull request titles (and commit messages on the master branch). Please follow the guidelines below when naming pull requests.

For types, we use the following:

- `feat`: A new feature
- `impr`: An improvement to an existing feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature, but makes the code easier to read, understand, or improve
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
- `revert`: Reverts a previous commit
- `chore`: Other changes that don't apply to any of the above

### Theme Guidelines

<!-- TODO: add screenshots to provide examples for dos and don'ts -->

Before submitting a theme make sure...

- your theme is unique and isn't visually similar to any we already have.
- the text color is either black or white (or very close to these colors)
- your theme has been added to the `_list` file and the `textColor` property is the theme's main color
- your theme is clear and readable with both `flip test colors` and `colorful mode` enabled and disabled

(If you want to contribute themes but don't know how, check [THEMES.md](./THEMES.md))

### Language Guidelines

- Do not include expletive words
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Be sure to add your language to the `_list` and `_groups` files
- Make sure the number of words in the file corresponds to the file name (for example: `languageName.json` is 200 words, `languageName_1k.json` is 1000 words, and so on)

(If you want to contribute languages but don't know how, check [LANGUAGES.md](./LANGUAGES.md))

### Quote Guidelines

- Do not include content that contains any libelous or otherwise unlawful, abusive, or obscene text.
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Verify quotes added aren't duplicates of any already present
- Verify the `length` property is correct (length of the text in characters)
- Verify the `id` property is incremented correctly
- Please do not add extremely short quotes (less than 60 characters)
- For quotes not in English, please include translations of quotes in the description of your pull request. This assists in the verification process to ensure the integrity of the quotes.
- Remember to name your pull request properly. For example, if you are adding new quotes for the language `French`, your pull request should be named `impr(quotes): add French quotes`.


(If you want to contribute quotes but don't know how, check [QUOTES.md](./QUOTES.md))

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or ask a question on Monkeytype's [GitHub discussions](https://github.com/monkeytypegame/monkeytype/discussions) and a contributor will be happy to assist you.
