# how to contribute

1. Head to [the firebase console](https://console.firebase.google.com/u/0/) and make a new project (the project name doesnt really matter, but just name it `monkey-type`). You dont need to enable analytics for it.
2. Install the [Firebase Command Line Interface](https://firebase.google.com/docs/cli), and use `firebase login` to log in to the same google account as you just used to make the project.
3. Git clone the project and make sure to rename `.firebaserc_example` to `.firebaserc` and change the project name inside to your firebase project name you just created.

   - If `.firebaserc_example` does not exist after cloning, create your own:

     {
     "projects": {
     "default": "monkey-type-dev-67af4",
     "live": "monkey-type"
     }
     }

   - The "live" option in `.firebaserc_example` is not necessary.

4. Run `firebase serve` to start a local server on port 5000. Use ctrl+c to stop it.
5. Run `firebase use default` if you run into any errors on step 5.

## standards & conventions

1. Use a SCSS compiler. For VSCode I recommend `Easy Sass` or `Live Sass Compiler` extension.
2. Install [Prettier](https://prettier.io/docs/en/install.html). Its a code formatter, and it will make sure that we avoid any whitespace or formatting issues when merging code.

That should be it. If you run into any problems, let me know.
