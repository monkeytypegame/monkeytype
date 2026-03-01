# Contributing - Advanced

## **Table of Contents**

- [Contributing - Advanced](#contributing---advanced)
  - [**Table of Contents**](#table-of-contents)
  - [Prerequisites](#prerequisites)
    - [Git](#git)
    - [NodeJS and PNPM](#nodejs-and-pnpm)
    - [Docker (Recommended but Optional)](#docker-recommended-but-optional)
    - [Firebase (optional)](#firebase-optional)
    - [Config file](#config-file)
    - [Databases (optional if running frontend only)](#databases-optional-if-running-frontend-only)
  - [Building and Running Monkeytype](#building-and-running-monkeytype)
    - [Dependencies (if running manually)](#dependencies-if-running-manually)
    - [Both Frontend and Backend](#both-frontend-and-backend)
    - [Backend only](#backend-only)
    - [Frontend only](#frontend-only)
  - [Standards and Guidelines](#standards-and-guidelines)
  - [Questions](#questions)

## Prerequisites

This contribution guide is for cases in which you need to test the functionality of your changes, or if you need to take screenshots of your changes. You will need a computer with a stable internet connection, a text editor, Git, and NodeJS with version 24.11.0. There are some additional requirements depending on what you're looking to contribute, such as Firebase for authentication, and Mongo and Docker for the backend. Read the below sections to understand how to set up each of these tools.

### Git

> [!WARNING]
> **If you are on Windows, run `git config --global core.autocrlf false` before cloning this repo to prevent CRLF errors.**

Git is optional but we recommend you utilize it. Monkeytype uses the Git source control management (SCM) system for its version control. Assuming you don't have experience typing commands in the command line, we suggest installing [Sourcetree](https://www.sourcetreeapp.com/). You will be able to utilize the power of Git without needing to remember any cryptic commands. Using a Git client such as Sourcetree won't give you access to the full functionality of Git, but provides an easy-to-understand graphical user interface (GUI). Once you have downloaded Sourcetree, run the installer. While installing Sourcetree, keep your eyes peeled for the option to also install Git with Sourcetree. This is the option you will need to look for in order to install Git. **Make sure to click yes in the installer to install Git with Sourcetree.**

### NodeJS and PNPM

Currently, the project is using version `24.11.0 LTS`.

If you use `nvm` (if you use Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows)) then you can run `nvm install` and `nvm use` (you might need to specify the exact version eg: `nvm install 24.11.0` then `nvm use 24.11.0`) to use the version of Node.js in the `.nvmrc` file.

Alternatively, you can navigate to the NodeJS [website](https://nodejs.org/en/) to download it from there.

For package management, we use `pnpm` instead of `npm` or `yarn`. You can install it by running `npm i -g pnpm@10.28.1`. This will install `pnpm` globally on your machine.

### Docker (Recommended but Optional)

You can use docker to run the frontend and backend. This will take care of OS-specific problems but might be a bit more resource-intensive. You can download it from the [Docker website](https://www.docker.com/get-started/#h_installation).

### Firebase (optional)

The account system will not let you create an account without a Firebase project. You can skip this if you don't think you will need it (you can always set it up later)

1. Create a Firebase account if you already haven't done so.
1. [Create a new Firebase project.](https://console.firebase.google.com/u/0/)
   - The project name doesn't matter, but the name `monkeytype` would be preferred.
   - Google Analytics is not necessary.

1. Enable Firebase Authentication
   - In the Firebase console, go to `Build > Authentication > Sign-in method`
   - Click on `Email/Password`, enable it, and save
   - Click on `Google`, add a support email, and save

1. Generate a Firebase Admin private key (optional, only needed if you want to work on the backend)
   - In your Firebase console, go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` inside the `backend/src/credentials/` directory.

1. Run `pnpm add -g firebase-tools` to install the Firebase Command Line Interface.
1. Run `firebase login` on your terminal to log in to the same Google account you just used to create the project.
1. Within the `frontend` directory, duplicate `.firebaserc_example`, rename the new file to `.firebaserc` and change the project name to the firebase project id you just created.
   - Run `firebase projects:list` to find your firebase project ID.
   - If `.firebaserc_example` does not exist after cloning, create your own with:

   ```.firebaserc
    {
        "projects": {
            "default": "your-firebase-project-id"
        }
    }
   ```

### Config file

Within the `frontend/src/ts/constants` directory, duplicate `firebase-config-example.ts`, rename it to `firebase-config.ts`

- If you skipped the Firebase step, you can leave the fields blank
- Otherwise:
  1. Navigate to `Project Settings > General > Your apps`
  2. If there are no apps in your project, create a new web app
  3. In the `SDK setup and configuration` section, select `npm`
  4. The Firebase config will be visible below
  5. Paste the config into `firebase-config.ts`
  6. Ensure there is an `export` statement before `const firebaseConfig`

If you want to access the frontend from other machines on your network create a file `frontend/.env` with this content:

```
BACKEND_URL="http://<Your IP>:5005"
```

### Databases (optional if running frontend only)

Follow these steps if you want to work on anything involving the database/account system. Otherwise, you can skip this section.

1. Inside the backend folder, copy `example.env` to `.env` in the same directory.

2. Setup the database server

| Manual                                                                                                                                                                                                                                                         | Docker (recommended)                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <ol><li>Install [MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/)</li><li>Install [Redis](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/)</li><li>Make sure both are running</li></ol> | <ol><li>Install [Docker](http://www.docker.io/gettingstarted/#h_installation) on your machine</li><li>Run `npm run docker-db-only` from the `./backend` directory</li></ol> |

3. (Optional) Install [MongoDB-compass](https://www.mongodb.com/try/download/compass?tck=docs_compass). This tool can be used to see and manipulate your database visually.
   - To connect, type `mongodb://localhost:27017` in the connection string box and press connect. The Monkeytype database will be created and shown after the server is started.

## Building and Running Monkeytype

It's time to run Monkeytype. Just like with the databases, you can run the frontend and backend manually or with Docker.

### Dependencies (if running manually)

Run `pnpm i` in the project root to install all dependencies.

### Both Frontend and Backend

Manual:

```
npm run dev
```

### Backend only

| Manual           | Docker                         |
| ---------------- | ------------------------------ |
| `npm run dev-be` | `cd backend && npm run docker` |

### Frontend only

| Manual           | Docker                          |
| ---------------- | ------------------------------- |
| `npm run dev-fe` | `cd frontend && npm run docker` |

These commands will start a local development website on [port 3000](http://localhost:3000) and a local development server on [port 5005](http://localhost:5005). They will automatically rebuild the website/server when you make changes in the `src/` directory. Use <kbd>Ctrl+C</kbd> to stop them.

> [!NOTE]
> Rebuilding doesn't happen instantaneously and depends on your machine, so be patient for changes to appear.

If you are on a UNIX system and you get a spawn error, run npm with `sudo`.

## Standards and Guidelines

Code formatting and linting is enforced by [Oxc (Oxfmt and Oxlint)](https://github.com/oxc-project/oxc), which automatically runs every time you make a commit.

For guidelines on commit messages, adding themes, languages, or quotes, please refer to [CONTRIBUTING.md](./CONTRIBUTING.md). Following these guidelines will increase the chances of getting your change accepted.

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or ask a question on Monkeytype's [GitHub discussions](https://github.com/monkeytypegame/monkeytype/discussions) and a contributor will be happy to assist you.
