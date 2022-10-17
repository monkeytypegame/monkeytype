# Contributing - Advanced

### **Table of Contents**

- [Prerequisites](#prerequisites)
  - [Git](#git)
  - [NodeJS and NPM](#nodejs-and-npm)
  - [Firebase](#firebase)
  - [Docker (Recommended but Optional)](#docker-recommended-but-optional)
  - [Backend (optional)](#backend-optional)
- [Building and Running Monkeytype](#building-and-running-monkeytype)
- [Standards and Guidelines](#standards-and-guidelines)
- [Questions](#questions)

## Prerequisites

This contribution guide is for cases in which you need to test the functionality of your changes, or if you need to take screenshots of your changes. You will need a computer with a stable internet connection, a text editor, Git, and NodeJS with version 16.13.2. There are some additional requirements depending on what you're looking to contribute, such as Firebase for authentication, Mongo and Docker for the backend. Read the below sections to understand how to set up each of these tools.

#### Git

**IMPORTANT: If you are on Windows, run `git config --global core.autocrlf false` before cloning this repo to prevent CRLF errors.**

Git is optional but we recommend you utilize it. Monkeytype uses the Git source control management (SCM) system for its version control. Assuming you don't have experience typing commands in the command line, we suggest installing [Sourcetree](https://www.sourcetreeapp.com/). You will be able to utilize the power of Git without needing to remember any cryptic commands. Using a Git client such as Sourcetree won't give you access to the full functionality of Git, but provides an easy to understand graphical user interface (GUI). Once you have downloaded Sourcetree, run the installer. While installing Sourcetree, keep your eyes peeled for the option to also install Git with Sourcetree. This is the option you will need to look for in order to install Git. **Make sure to click yes in the installer to install Git with Sourcetree.**

#### NodeJS and NPM

Currently, the project is using version `16.13.2 LTS`.

If you use `nvm` (if you use Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows)) then you can run `nvm install` and `nvm use` (you might need to specify the exact version) to use the version of Node.js in the `.nvmrc` file.

Alternatively, you can navigate to the NodeJS [website](https://nodejs.org/en/) to download it from there.

#### Docker (Recommended but Optional)

You can use docker to run the frontend and backend. This will take care of OS specific problems, but might be a bit more resource intensive. You can download it from the [Docker website](https://www.docker.com/get-started/#h_installation).

#### Firebase (optional)

The account system will not let you create an account without a Firebase project. You can skip this if you don't think you will need it (you can always set it up later)

1. Create a Firebase account if you already haven't done so.
1. [Create a new Firebase project.](https://console.firebase.google.com/u/0/)

   - The project name doesn't matter, but the name `monkeytype` would be preferred.
   - Google Analytics is not necessary.

1. Enable Firebase Authentication

   - In the Firebase console, go to `Authentication > Sign-in method`
   - Click on `Email/Password`, enable it, and save
   - Click on `Google`, add a support email and save

1. Generate a Firebase Admin private key (optional, only needed if you want to work on the backend)

   - In your Firebase console, go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` inside the `backend/src/credentials/` directory.

1. Run `npm install -g firebase-tools` to install the Firebase Command Line Interface.
1. Run `firebase login` on your terminal to log in to the same google account you just used to create the project.
1. Within the `frontend` directory, duplicate `.firebaserc_example`, rename the new file to `.firebaserc` and change the project name to the firebase project id you just created.

   - Run `firebase projects:list` to find your firebase project id.
   - If `.firebaserc_example` does not exist after cloning, create your own with:

   ```.firebaserc
    {
        "projects": {
            "default": "your-firebase-project-id"
        }
    }
   ```

#### Config file

Within the `frontend/src/ts/constants` directory, duplicate `firebase-config-example.ts`, rename it to `firebase-config.ts`

- If you skipped the Firebase step, you can leave the fields blank
- Otherwise:
  1. Navigate to `Project Settings > General > Your apps`
  2. If there are no apps in your project, create a new web app
  3. In the `SDK setup and configuration` section, select `npm`
  4. The Firebase config will be visible below
  5. Paste the config into `firebase-config.ts`

#### Backend (optional)

Follow these steps if you want to work on anything involving the database/account system. Otherwise, you can skip this section.

1. Inside the backend folder, copy `example.env` to `.env` in the same directory.

2. Setup the database server

| Local Server                                                                                                                                             | Docker (recommended)                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <ol><li>Install [MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/)</li><li>Make sure it is running</li></ol> | <ol><li>Install [Docker](http://www.docker.io/gettingstarted/#h_installation) on your machine</li><li>Run `docker-compose up` from the `./backend` directory (this is also how you start the database)</li></ol> |

3. (Optional) Install [MongoDB-compass](https://www.mongodb.com/try/download/compass?tck=docs_compass). This tool can be used to see and manipulate your database visually.
   - To connect, type `mongodb://localhost:27017` in the connection string box and press connect. The Monkeytype database will be created and shown after the server is started.

## Building and Running Monkeytype

Run `npm run install-all` in the project root to install all dependencies.

- If you are on Windows, use `npm run install-windows`.
- If neither works, you will have to run `npm install` in root, frontend, and backend directories.

Then, you are ready to build and run Monkeytype. If you are using Docker:

- Frontend:
  ```
  cd frontend && docker-compose up
  ```
  
- Backend (in another terminal window):
  ```
  cd backend && docker-compose up
  ```

If you are **_not_** using Docker:

- Frontend and backend
  ```
  npm run dev
  ```
  
- Only frontend (if you skipped the Backend section):
  ```
  npm run dev-fe
  ```

These commands will start a local dev server on [port 3000](http://localhost:3000). It will watch for changes and rebuild when you edit files in `src/` or `public/` directories. Use `Ctrl+C` to stop it.

Note: Rebuilding doesn't happen instantaneously and depends on your machine, so be patient for changes to appear.

## Standards and Guidelines

Code style is enforced by [Prettier](https://prettier.io/docs/en/install.html), which automatically runs every time you make a commit.

For guidelines on adding themes, languages or quotes, pleases refer to [CONTRIBUTING.md](./CONTRIBUTING.md). Following these guidelines will increase the chances of getting your change accepted.

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or ask a question on Monkeytype's [GitHub discussions](https://github.com/monkeytypegame/monkeytype/discussions) and a contributor will be happy to assist you.
