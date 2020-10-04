# Contributing

## Project Setup

1.  [Create a new Firebase project. ](https://console.firebase.google.com/u/0/)

    - The project name doesn't really matter, but just name it `monkey-type`.
    - Google Analytics is not necessary.

2.  [Install the Firebase CLI](https://firebase.google.com/docs/cli)
3.  Run `firebase login` on your terminal to log in to the same google account as you just used to create the project.
4.  Git clone this project.
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

1. Use a SCSS compiler, and make sure that a `style.mis.css` file is generated in the same directory as the `style.scss`. For VSCode I recommend `Easy Sass` extension by Wojciech Sura. After installing it, to configure it:

    - Navigate to the VSCode settings, `Extensions` section and find `Easy Sass configuration`
    - Under the `Formats` group click `edit in settings.json`
    - Make sure this the code looks like this:
    ```json
    "easysass.formats": [
        {
            "format": "compressed",
            "extension": ".min.css"
        }
    ],
    ```
    *This will make sure that only a minified file is generated.*

    -Finally, using the command palete (`ctrl/cmd + shift + p`), use the `Compile all SCSS/SASS files in the project` option. You only need to do this once. After this the files will be compiled on save.
    
2. Install [Prettier](https://prettier.io/docs/en/install.html). Its a code formatter, and it will make sure that we avoid any whitespace or formatting issues when merging code.

## Questions

If you run into any problems, let me know on [GitHub](https://github.com/Miodec) or [Discord](https://discord.gg/monkeytype) in the `#development` channel.
