# Contributing

### **Table of Contents**

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
  - [Text Editor](#text-editor)
  - [Git](#git)
  - [NodeJS and NPM](#nodejs-and-npm)
  - [Firebase](#firebase)
  - [Mongo Setup](#mongo-setup)
- [Building and Running Monkeytype](#building-and-running-monkeytype)
- [Standards and Guidelines](#standards-and-guidelines)
  - [Theme Guidelines](#theme-guidelines)
  - [Language Guidelines](#language-guidelines)
  - [Quote Guidelines](#quote-guidelines)
- [Questions](#questions)

## Getting Started

When contributing to Monkeytype, it's good to know our best practices, tips, and tricks. First, Monkeytype is written in ~~JavaScript~~ TypeScript, CSS, and HTML (in order of language usage within the project); thus, we assume you are comfortable in these languages or have basic knowledge of them. Our backend is in NodeJS and we use MongoDB to store our user data. Firebase is used for authentication. Furthermore, we use Prettier to format our code.

## Prerequisites

While most contributions don't require that you install dependencies, there are a few tools you will need to be able to run the project (this is useful and almost always necessary for tasks like creating features and fixing bugs; running the project is also useful if you are contributing a theme and want to view it on the site before you contribute it). You will need a computer with a stable internet connection, a text editor, Git, Firebase, and NodeJS with version 16.13.2.

#### Text Editor

If you are not a developer and wish to contribute themes, new languages, or quotes, having a text editor will make contributions _much_ easier. To make complex edits without installing anything, we recommend using GitHub's VS Code web editor. In your fork of Monkeytype(fork it first), go to the `Code` tab of the repo and press <kbd>.</kbd>(the period/dot key). This will open up the repo in an online VS Code instance you can use to edit files in the browser. Once you are done making your changes, go the to Source Control tab in the activity bar with <kbd>Ctrl/Cmd + Shift + G</kbd>, click the `+` next to the files you've changed to stage them,type a brief message summarizing the changes made in the commit, and press <kbd>Ctrl/Cmd + Enter</kbd> to commit your changes to your fork(send a pull request to the Monkeytype repository when you are ready).

#### Git

Git is optional but we recommend you utilize it. Monkeytype uses the Git source control management system (SCM) for its version control. Assuming you don't have experience typing commands in the command line, we suggest installing [Sourcetree](https://www.sourcetreeapp.com/). You will be able to utilize the power of Git without needing to remember any cryptic commands. However using a Git client won't give you access to the full functionality of Git but provides an easy to understand graphical user interface (GUI). Once you have downloaded Sourcetree, run the installer. While installing Sourcetree, keep your eyes peeled for the option to also install Git with Sourcetree. This is the option you will need to look for in order to install Git. **Make sure to click yes in the installer to install Git with Sourcetree.**

#### NodeJS and NPM

To install NodeJS, navigate to the NodeJS [website](https://nodejs.org/en/) and download the `16.13.2 LTS`.

Alternatively, if you use `nvm` then you can run `nvm install` and `nvm use` (you might need to specify the exact version) to use the version of Node.js in the `.nvmrc` file (if you use Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows)).

#### Firebase

1. Create a Firebase account if you already haven't done so.
1. [Create a new Firebase project.](https://console.firebase.google.com/u/0/)

   - The project name doesn't matter, but the name `monkeytype` would be preferred.
   - Google Analytics is not necessary.

1. Run `npm install -g firebase-tools` to install the Firebase Command Line Interface.
1. Run `firebase login` on your terminal to log in to the same google account you just used to create the project.
1. Git clone this project.
   - IMPORTANT: If you are on Windows, run `git config --global core.autocrlf false` before-hand to prevent CRLF errors.
1. Within the frontend directory, duplicate `.firebaserc_example`, rename the new file to `.firebaserc` and change the project name of default to the firebase project id you just created.

   - If `.firebaserc_example` does not exist after cloning, create your own with:

   ```.firebaserc
    {
        "projects": {
            "default": "your-firebase-project-id"
        }
    }
   ```

   - Run `firebase projects:list` to find your firebase project id.

1. Generate a Firebase Admin private key

   - In your Firebase console, go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` inside the `backend/credentials/` directory.

1. Enable Firebase Authentication

   - In the Firebase console, go to `Authentication > Sign-in method`
   - Click on `Email/Password`, enable it, and save
   - Click on `Google`, add a support email and save

#### Mongo Setup

Follow these steps if you want to work on anything involving the database/account system. If not, you can skip this section.

1. Install [MongodDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/) and ensure that it is running

1. Inside the backend folder, copy `example.env` to `.env` in the same directory.

   1. If necessary, uncomment the lines in the `.env` file to use credentials to login to MongoDB.

1. Optional - Install [MongoDB-compass](https://www.mongodb.com/try/download/compass?tck=docs_compass). This tool can be used to see and manipulate your data visually.
   1. To connect, type `mongodb://localhost:27017` in the connection string box and press connect. The monkeytype database will be created and shown` after the server is started`.

## Building and Running Monkeytype

Once you have completed the above steps, you are ready to build and run Monkeytype.

1. Run `npm run install:all` in the project root to install all dependencies.
   - If you are on Windows, use `npm run install:windows`.
   - If none of this works, you will have to run `npm install` in root, frontend, and backend directories.
2. Run `npm run start:dev` (`npm run start:dev:fe` if you skipped the mongo section) to start a local dev server on [port 5000](http://localhost:5000). It will watch for changes and rebuild when you edit files in `src/` or `public/` directories. Note that rebuilding doesn't happen instantaneously so be patient for changes to appear. Use <kbd>Ctrl+C</kbd> to kill it.

**Mac Users:** If you get 403 Forbidden errors while trying to access the local server, go into System Preferences > Sharing and disable AirPlay Receiver - it also runs on port 5000 and takes priority, causing 403 errors.

## Standards and Guidelines

Code style is enforced by [Prettier](https://prettier.io/docs/en/install.html), which automatically runs every time you make a commit(`git commit`) (if you've followed the above instructions properly).

We recommend following the guidelines below to increase your chances of getting your change accepted.

#### Theme Guidelines

<!-- TODO: add screenshots to provide examples for dos and don'ts -->

Before submitting a theme make sure...

- your theme is unique and isn't visually similar to any we already have.
- the text color is either black or white (or very close to these colors)
- your theme has been added to the `_list` file and the `textColor` property is the theme's main color
- your theme is clear and readable with both `flip test colors` and `colorful mode` enabled and disabled

(If you want to contribute themes but don't know how to, check [THEMES.md](https://github.com/Miodec/monkeytype/blob/master/THEMES.md))

#### Language Guidelines

- Do not include swear words
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Be sure to add your language to the `_list` and `_groups` files
- Make sure the number of words in the file corresponds to the file name (for example: `languageName.json` is 200 words, `languageName_1k.json` is 1000 words, and so on)

(If you want to contribute languages but don't know how to, check [LANGUAGES.md](https://github.com/Miodec/monkeytype/blob/master/LANGUAGES.md))

#### Quote Guidelines

- Do not include content that contains any libelous or otherwise unlawful, abusive or obscene text.
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Verify quotes added aren't duplicates of any already present
- Verify the `length` property is correct (length of the text in characters)
- Verify the `id` property is incremented correctly
- Please do not add extremely short quotes (less than 60 characters)

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or ask a question on Monkeytype's [GitHub discussions](https://github.com/Miodec/monkeytype/discussions) and a contributor will be happy to assist you.
