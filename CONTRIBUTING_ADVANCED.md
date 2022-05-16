# Contributing - Advanced

### **Table of Contents**

- [Prerequisites](#prerequisites)
  - [Git](#git)
  - [NodeJS and NPM](#nodejs-and-npm)
  - [Firebase](#firebase)
  - [Backend (optional)](#backend-optional)
- [Building and Running Monkeytype](#building-and-running-monkeytype)
- [Standards and Guidelines](#standards-and-guidelines)
- [Questions](#questions)

## Prerequisites

This contribution guide is for cases in which you need to test the functionality of your changes, or if you need to take screenshots of your changes. You will need a computer with a stable internet connection, a text editor, Git, Firebase, and NodeJS with version 16.13.2. There are some additional requirements depending on what you're looking to contribute, such as Mongo and Docker for the backend. Read the below sections to understand how to setup each of these tools.

#### Git

Git is optional but we recommend you utilize it. Monkeytype uses the Git source control management (SCM) system for its version control. Assuming you don't have experience typing commands in the command line, we suggest installing [Sourcetree](https://www.sourcetreeapp.com/). You will be able to utilize the power of Git without needing to remember any cryptic commands. Using a Git client such as Sourcetree won't give you access to the full functionality of Git, but provides an easy to understand graphical user interface (GUI). Once you have downloaded Sourcetree, run the installer. While installing Sourcetree, keep your eyes peeled for the option to also install Git with Sourcetree. This is the option you will need to look for in order to install Git. **Make sure to click yes in the installer to install Git with Sourcetree.**

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
1. Within the `frontend` directory, duplicate `.firebaserc_example`, rename the new file to `.firebaserc` and change the project name of default to the firebase project id you just created.

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

#### Backend (optional)

Follow these steps if you want to work on anything involving the database/account system. Otherwise, you can skip this section.

1. Inside the backend folder, copy `example.env` to `.env` in the same directory.

2. Setup the database server

| Local Server                                                                                                                            | Docker (recommended)                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <ol><li>Install [MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/)</li><li>Make sure it is running</li></ol> | <ol><li>Install [Docker](http://www.docker.io/gettingstarted/#h_installation) on your machine</li><li>Run `docker-compose up` from the `./backend` directory</li></ol> |

3. (Optional) Install [MongoDB-compass](https://www.mongodb.com/try/download/compass?tck=docs_compass). This tool can be used to see and manipulate your data visually.
   1. To connect, type `mongodb://localhost:27017` in the connection string box and press connect. The monkeytype database will be created and shown after the server is started.

## Building and Running Monkeytype

Once you have completed the above steps, you are ready to build and run Monkeytype.

1. Run `npm run install:all` in the project root to install all dependencies.
   - If you are on Windows, use `npm run install-windows`.
   - If neither works, you will have to run `npm install` in root, frontend, and backend directories.
2. Run `npm run dev` (`npm run dev-fe` if you skipped the mongo section) to start a local dev server on [port 5000](http://localhost:5000). It will watch for changes and rebuild when you edit files in `src/` or `public/` directories. Note that rebuilding doesn't happen instantaneously so be patient for changes to appear. Use <kbd>Ctrl+C</kbd> to kill it.

**Mac Users:** If you get 403 Forbidden errors while trying to access the local server, go into System Preferences > Sharing and disable AirPlay Receiver - it also runs on port 5000 and takes priority, causing 403 errors.

## Standards and Guidelines

Code style is enforced by [Prettier](https://prettier.io/docs/en/install.html), which automatically runs every time you make a commit (`git commit`) (if you've followed the above instructions properly).

We recommend following the guidelines below to increase your chances of getting your change accepted.

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or ask a question on Monkeytype's [GitHub discussions](https://github.com/monkeytypegame/monkeytype/discussions) and a contributor will be happy to assist you.
