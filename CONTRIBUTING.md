# Contributing

## **Table of Contents**

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

When contributing to Monkeytype, it's good to know our best practices, tips, and tricks. First, Monkeytype is written in TypeScript, SCSS, and HTML. Thus, we assume you are comfortable in these languages or have basic knowledge. We use NodeJS for the backend, MongoDB to store our user data, and Firebase for authentication. Furthermore, we use Prettier to format our code.

## Prerequisites

While most contributions do not require you to set up the project, you will need to if you are fixing a bug, implementing a new feature, or creating a new theme. You will need a computer with a stable internet connection, a text editor, Git, Firebase, and NodeJS version 16.13.2.

### Text Editor

If you are not a developer and wish to contribute themes, new languages, or quotes, having a text editor will make contributions _much_ easier. To edit on the web, use GitHub's Visual Studio Code web editor. First, fork Monkeytype, then go to the `Code` tab of the repo and press <kbd>.</kbd>(the period/dot key). That will open up the repo in an online Visual Studio Code instance. When you are finished editing, go to the Source Control tab (<kbd>Ctrl/Cmd + Shift + G</kbd>), and click the `+` next to the files you have changed to stage them. Then, type a brief message summarizing the changes made in the commit, and commit your changes to the fork (<kbd>Ctrl/Cmd + Enter</kbd>). Finally, send a pull request to the Monkeytype repository when ready.

### Git

Git is optional, but we recommend you utilize it. Monkeytype uses the Git source control management (SCM) system for its version control. Assuming you don't have experience typing commands in the command line, we suggest installing [Sourcetree](https://www.sourcetreeapp.com/). You will be able to utilize the power of Git without needing to remember any cryptic commands. Using a Git client such as Sourcetree won't give you access to the full functionality of Git, but provides an easy to understand graphical user interface (GUI). Once you have downloaded Sourcetree, run the installer. While installing Sourcetree, keep your eyes peeled for the option to install Git with Sourcetree. That is the option you need to look for in order to install Git.

### NodeJS and NPM

To install NodeJS, navigate to the NodeJS [website](https://nodejs.org/en/) and download the `16.13.2 LTS`.

Alternatively, if you use `nvm`, you can run `nvm install` and `nvm use` (you may need to specify the version) to use the correct version of Node.js found in the `.nvmrc` file. If you use Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows).

### Firebase

1. Create a Firebase account if you already haven't done so.
1. [Create a new Firebase project.](https://console.firebase.google.com/u/0/)

   - The project name doesn't matter, but the name `monkeytype` would be preferred.
   - Google Analytics is not necessary.

1. Run `npm install -g firebase-tools` to install the Firebase Command Line Interface.
1. Run `firebase login` on your terminal to log in to the same google account you just used to create the project.
1. Git clone this project.
   - IMPORTANT: If you are on Windows, run `git config --global core.autocrlf false` before-hand to prevent CRLF errors.
1. Within the `frontend` directory, duplicate `.firebaserc_example`, rename the new file to `.firebaserc` and change the project name to the firebase project id you just created.

   - If `.firebaserc_example` does not exist after cloning, create your own with:

   ```.firebaserc
    {
        "projects": {
            "default": "your-firebase-project-id"
        }
    }
   ```

   - Run `firebase projects:list` to find your firebase project id.

1. Within the `frontend/src/ts/constants` directory, duplicate `firebase-config-example.ts`, rename it to `firebase-config.ts` and paste in your firebase config

   - To find it, go to the Firebase console
   - Navigate to `Project Settings > General > Your apps`
     - If there are no apps in your project, create a new web app
   - In the `SDK setup and configuration` section, select `npm`
   - The Firebase config will be visible below

1. Enable Firebase Authentication (optional)

   - In the Firebase console, go to `Authentication > Sign-in method`
   - Click on `Email/Password`, enable it, and save
   - Click on `Google`, add a support email and save

1. Generate a Firebase Admin private key (optional, only needed if you want to work on the backend)

   - In your Firebase console, go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` inside the `backend/credentials/` directory.

### Mongo Setup

Follow these steps if you want to work on anything involving the database/account system. Otherwise, you can skip this section.

1. Install [MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/) and ensure that it is running

1. Inside the backend folder, copy `example.env` to `.env` in the same directory.

   1. If necessary, uncomment the lines in the `.env` file to use credentials to login to MongoDB.

1. Optional - Install [MongoDB Compass](https://www.mongodb.com/try/download/compass?tck=docs_compass). MongoDB Compass is used to view and manipulate data visually.
   1. To connect, type `mongodb://localhost:27017` in the connection string box and press connect. The monkeytype database will be created and shown after the server starts.

## Building and Running Monkeytype

Once you have completed the above steps, you are ready to build and run Monkeytype.

1. Run `npm run install:all` in the project root to install all dependencies.
   - If you are on Windows, use `npm run install:windows`.
   - If neither works, you will have to run `npm install` in root, frontend, and backend directories.
2. Run `npm run dev` (`npm run dev:fe` if you skipped the mongo section) to start a local dev server on [port 5000](http://localhost:5000). It will watch for changes and rebuild when you edit files in `src/` or `public/` directories. Note that rebuilding doesn't happen instantaneously, be patient for changes to appear. Use <kbd>Ctrl+C</kbd> to kill it.

**Mac Users:** If you receive a "403 Forbidden" error while accessing the local server, go to System Preferences > Sharing and disable AirPlay Receiver. The AirPlay Receiver also runs on port 5000, causing errors.

## Standards and Guidelines

Code style is enforced by [Prettier](https://prettier.io/docs/en/install.html), which automatically runs every time you commit changes (`git commit`) (if you've followed the above instructions).

We recommend following the guidelines below to increase your chances of getting your change accepted.

### Theme Guidelines

<!-- TODO: add screenshots to provide examples for dos and don'ts -->

Before submitting a theme make sure:

- your theme is unique and isn't visually similar to any we already have.
- the text color is either black or white (or of a similar shade)
- your theme was added to the `_list.json` file and that the `textColor` property is the theme's "main" color
- your theme is clear and readable with both `flip test colors` and `colorful mode` enabled and disabled

(If you want to contribute themes but don't know how, check [THEMES.md](https://github.com/Miodec/monkeytype/blob/master/THEMES.md))

### Language Guidelines

- Do not include profanity
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Be sure to add your language to the `_list` and `_groups` files
- Make sure the number of words in the file corresponds to the file name (for example: `languageName.json` is 200 words, `languageName_1k.json` is 1000 words, and so on)

(If you want to contribute languages but don't know how, check [LANGUAGES.md](https://github.com/Miodec/monkeytype/blob/master/LANGUAGES.md))

### Quote Guidelines

- Do not include content that contains any libelous or otherwise unlawful, abusive or obscene text.
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Verify quotes added aren't duplicates of any already present
- Verify the `length` property is correct (length of the text in characters)
- Verify the `id` property is incremented correctly
- Please do not add very short quotes (less than 60 characters)

(If you want to contribute quotes but don't know how, check [QUOTES.md](https://github.com/teddinotteddy/monkeytype/blob/8d5ffde578030a07458cec391e862f8f3cd5b4b4/QUOTES.md))

## Questions

If you have any questions, comments, concerns, or problems, let us know on [Discord](https://discord.gg/monkeytype) in the `#development` channel or ask a question on our [GitHub discussions page](https://github.com/Miodec/monkeytype/discussions) and we will be happy to assist you.
