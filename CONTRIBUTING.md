# Contributing

## Technologies

- NodeJS v10
- Firebase

## Prerequisite - Firebase Setup

1. [Create a new Firebase project.](https://console.firebase.google.com/u/0/)

   - The project name doesn't really matter, but just name it `monkeytype`.
   - Google Analytics is not necessary.

1. [Install the Firebase CLI](https://firebase.google.com/docs/cli)
1. Run `firebase login` on your terminal to log in to the same google account as you just used to create the project.
1. Git clone this project.
1. Rename `.firebaserc_example` to `.firebaserc` and change the project name of default to the firebase project id you just created.

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
   - Save as `serviceAccountKey.json` in the `functions/` directory

1. Enable Firebase Authentication

   - In the Firebase console, go to Authentication
   - Click on `Email/Password`, enable it and save
   - Click on `Google`, add a support email and save

## Building and Running

1. Run `npm install` in the project root directory to install dependencies.
1. Run `npm run start:dev` to start a local dev server on port 5000. It will watch for changes and rebuild when you edit files in `src/` or `public/`. Use ctrl+c to stop it.
   - Run `firebase use <your-project-id>` if you run into any errors for this.

## Standards and Conventions

1. Code style is enforced by [Prettier](https://prettier.io/docs/en/install.html), which is automatically run every time you `git commit` (if you've followed the above instructions properly).

## Questions

If you run into any problems, let me know on [GitHub](https://github.com/Miodec) or [Discord](https://discord.gg/monkeytype) in the `#development` channel.
