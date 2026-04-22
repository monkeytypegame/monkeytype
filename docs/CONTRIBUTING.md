# Contributing

### **Table of Contents**

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Standards and Guidelines](#standards-and-guidelines)
  - [Theme Guidelines](#theme-guidelines)
  - [Language Guidelines](#language-guidelines)
  - [Quote Guidelines](#quote-guidelines)
  - [Layout Guidelines](#layout-guidelines)
- [Questions](#questions)

## Getting Started

When contributing to Monkeytype, it's good to know our best practices, tips, and tricks. First, Monkeytype is written in ~~JavaScript~~ TypeScript, HTML, and CSS (in order of language usage within the project); thus, we assume you are comfortable with these languages or have basic knowledge of them. Our backend is in NodeJS and we use MongoDB to store our user data. Firebase is used for authentication. Redis is used to store ephemeral data (daily leaderboards, jobs via BullMQ, OAuth state parameters). Furthermore, we use Oxc (Oxfmt and Oxlint) to format and lint our code.

## How to Contribute

We have two separate contribution guides based on what you're looking to contribute. If you're simply looking to help us augment our language or quotes data, please refer to [CONTRIBUTING_BASIC.md](/docs/CONTRIBUTING_BASIC.md). This guide will go over how to do so easily and without the need to set up a local development server.

If you're looking to make deeper code changes that affect functionality, or will require screenshots of the changes, please refer to [CONTRIBUTING_ADVANCED.md](/docs/CONTRIBUTING_ADVANCED.md).

## Standards and Guidelines

Below is a set of general guidelines for different types of changes.

### Pull Request Naming Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for our pull request titles (and commit messages on the master branch) and also include the author name at the end inside parenthesis. Please follow the guidelines below when naming pull requests.

For types, we use the following:

- `feat`: A new feature
- `impr`: An improvement to an existing feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature, but makes the code easier to read, understand, or improve
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies (example scopes: vite, tsup-node, npm)
- `ci`: Changes to our CI configuration files and scripts (e.g., GitHub Workflows)
- `revert`: Reverts a previous commit
- `chore`: Other changes that don't apply to any of the above

#### Examples

- `feat: add new feature (@github_username)`
- `impr(quotes): add english quotes (@username)`
- `fix(leaderboard): show user rank correctly (@user1, @user2, @user3)`

### Adding Themes

<!-- TODO: add screenshots to provide examples for dos and don'ts -->

If you want to contribute themes but don't know how, check [THEMES.md](/docs/THEMES.md)

### Adding Languages

If you want to contribute languages but don't know how, check [LANGUAGES.md](/docs/LANGUAGES.md)

### Adding Quotes

If you want to contribute quotes but don't know how, check [QUOTES.md](/docs/QUOTES.md)

### Adding Layouts

If you want to contribute layouts but don't know how, check [LAYOUTS.md](/docs/LAYOUTS.md)

### Adding Fonts

If you want to contribute fonts but don't know how, check [FONTS.md](/docs/FONTS.md)

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or ask a question on Monkeytype's [GitHub discussions](https://github.com/monkeytypegame/monkeytype/discussions) and a contributor will be happy to assist you.
