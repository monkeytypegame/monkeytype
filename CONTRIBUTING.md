# Contributing

## Project Setup

1.  [Make a new Firebase project. ](https://console.firebase.google.com/u/0/)

    - The project name doesn't really matter, but just name it `monkey-type`.
    - Google Analytics not necessary.

2.  [Install the Firebase CLI](https://firebase.google.com/docs/cli)
3.  Run `firebase login` on your terminal to log in to the same google account as you just used to make the project.
4.  Git clone the project.
5.  Rename `.firebaserc_example` to `.firebaserc` and change the project name of default to the firebase project id you just created.

    - If `.firebaserc_example` does not exist after cloning, create your own with:

    ```.firebaserc
     {
         "projects": {
             "default": "your-firebase-project-id",
         }
     }
    ```

    - Run `firebase projects:list` to find your firebase project id.

6.  Run `firebase serve` to start a local server on port 5000. Use ctrl+c to stop it.
    - Run `firebase use default` if you run into any errors for this.

## Standards & Conventions

1. Use a SCSS compiler. For VSCode I recommend `Easy Sass` or `Live Sass Compiler` extension.
2. Install [Prettier](https://prettier.io/docs/en/install.html). Its a code formatter, and it will make sure that we avoid any whitespace or formatting issues when merging code.

## Questions

That should be it. If you run into any problems, let [me](https://github.com/Miodec) know.
