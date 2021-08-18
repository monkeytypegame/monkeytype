# Contributing

### **Table of Contents**

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
  - [Text Editor](#text-editor)
  - [Git ](#git)
  - [NodeJS](#nodejs)
  - [Firebase](#firebase)
- [Building and Running Monkeytype](#building-and-running-monkeytype)
- [Standards and Guidelines](#standards-and-guidelines)
  - [Theme Guidelines](#theme-guidelines)
  - [Language Guidelines](#language-guidelines)
  - [Quote Guidelines](#quote-guidelines)
- [Questions](#questions)

---

## Getting Started

When contributing to Monkeytype, it's good to know our best practices, tips, and tricks. First, Monkeytype is written in Javascript, CSS, and HTML (in order of language usage within the project); thus, we assume you are comfortable in these languages or have basic knowledge of them. Our backend is in NodeJS and we use Firebase to store our user data. Furthermore, we use Prettier to format our code.

### Prerequisites

While most contributions don't require that you install dependencies, there are a few minimum requirements you will need to meet to be able to run the project (this is useful and almost always necessary for tasks like creating features and fixing bugs; running the project is also useful if you are contributing a theme and want to view it on the site before you contribute it). You will need a computer with a stable internet connection, a text editor, Git, Firebase, and NodeJS with a version < 14.

#### Text Editor

If you are not a developer and wish to contribute themes, new languages, or quotes, having a text editor will make contributions _much_ easier. A popular and relatively lightweight editor that we recommend is [Visual Studio Code](https://code.visualstudio.com/) or VS Code. It is free and open-source from Microsoft. Simply run the installer and follow the prompts. Once you have VS Code installed, you are ready to start contributing.

#### Git

Git is optional but we _highly_ recommend you use it. Monkeytype uses the Git source control management system for its version control. Assuming you don't have experience typing commmands in the command line, we suggest installing [Sourcetree](https://www.sourcetreeapp.com/). You will be able to utilize the power of Git without needing to remember any cryptic commands. However using a Git client won't give you access to the full functionality of Git but provides an easy to understand graphical user interface (GUI). Once you have downloaded Sourcetree, run the installer. While installing Sourcetree, keep your eyes peeled for the option to also install Git with Sourcetree. This is the option you will need to look for in order to install Git. **Make sure to click yes in the installer to install Git with Sourcetree.**

#### Firebase

1. Create a Firebase account if you already haven't done so.
1. [Create a new Firebase project.](https://console.firebase.google.com/u/0/)

   - The project name doesn't matter, but the name `monkeytype` would be preferred.
   - Google Analytics is not necessary.

1. [Install the Firebase CLI](https://firebase.google.com/docs/cli)
1. Run `firebase login` on your terminal to log in to the same google account you just used to create the project.
1. Git clone this project.
1. Duplicate `.firebaserc_example`, rename the new file to `.firebaserc` and change the project name of default to the firebase project id you just created.

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
   - Save as `serviceAccountKey.json` inside the `backend/credentials/` directory. You will have to create the credentials folder.

1. Enable Firebase Authentication

   - In the Firebase console, go to Authentication
   - Click on `Email/Password`, enable it, and save
   - Click on `Google`, add a support email and save

#### Mongo Setup

1. Install [Mongodb Community Edition](https://docs.mongodb.com/manual/administration/install-community/) and ensure that it is running

1. Inside the backend folder, copy `example.env` to `.env` in the same directory.

1. Optional - Install [Mongodb-compass](https://www.mongodb.com/try/download/compass?tck=docs_compass). This tool can be used to see and manipulate your data visually.
   1. To connect, type `mongodb://localhost:27017` in the connection string box and press connect. The monkeytype database will be created and shown` after the server is started.

#### NodeJS

The installation process of NodeJS is fairly simple, navigate to the NodeJS [website](https://nodejs.org/en/) and download the `xx.xx.x LTS`. Run the installer once the download has finished.

### Building and Running Monkeytype

Once you have completed the above steps, you are ready to build and run Monkeytype.

1. Run `npm install` in the project root directory to install dependencies.
1. Run `npm run start:dev` to start a local dev server on [port 5000](http://localhost:5000). It will watch for changes and rebuild when you edit files in `src/` or `public/` directories. Note that rebuilding doesn't happen instantaneously so be patient for changes to appear. Use <kbd>Ctrl+C</kbd> to kill it.

### Standards and Guidelines

Code style is enforced by [Prettier](https://prettier.io/docs/en/install.html), which automatically runs every time you `git commit` (if you've followed the above instructions properly).

Following the guidelines below will increase your chances of getting your change accepted.

#### Theme Guidelines

<!-- TODO: add screenshots to provide examples for dos and don'ts -->

- Make sure your theme is unique and a similar looking one is not already available
- The text color is either black or white (or very close to)
- Your theme has been added to the `_list` file and the `textColor` property is the theme's main color
- Your theme is clear and readable with both `flip test colors` and `colorful mode` enabled and disabled

#### Language Guidelines

- Do not include swear words
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Be sure to add your language to the `_list` and `_groups` files
- Make sure the number of words corresponds to the file name (for example: `languageName.json` is 200 words, `langugeName_1k.json` is 1000 words, and so on)

#### Quote Guidelines

- Do not include swear words
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Verify quotes added aren't duplicates of any already present
- Verify the `length` property is correct (length of the text in characters)
- Verify the `id` property is incremented correctly

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or on Monkeytype's [GitHub discussions](https://github.com/Miodec/monkeytype/discussions).
