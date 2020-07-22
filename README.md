# about
Monkey-type is a minimalistic, customisable typing test, featuring many test modes, an account system to save your typing speed history and user configurable features like themes, a smooth caret and more.

# features
- minimalistic design with no ads
- look at what you are typing
- focus mode
- different test modes
- punctuation mode
- themes
- live wpm
- smooth caret
- account system
- command line
- and much more

# discord bot
Recently, a Discord bot was added to autoassign roles. You can find the code for it over at https://github.com/Miodec/monkey-bot

# bug report or feature request
If you encounter a bug, or have a feature request - send me a message on Reddit, create an issue or join the [Discord server](https://discord.com/invite/yENzqcB).

# credits 
Montydrei for the name suggestion
Everyone who provided valuable feedback on the original reddit post for the prototype of this website
Contributors that have helped with implementing various features, adding themes and more.

# support
If you wish to support further development and feeling extra awesome, you can do so [here](https://www.paypal.me/jackbartnik).

# how to contribute
1. Head to [the firebase console](https://console.firebase.google.com/u/0/) and make a new project (the project name doesnt really matter, but just name it `monkey-type`). You dont need to enable analytics for it.
2. Install the [Firebase Command Line Interface](https://firebase.google.com/docs/cli), and use `firebase login` to log in to the same google account as you just used to make the project.
3. Git clone the project and make sure to rename `.firebaserc_example` to `.firebaserc` and change the project name inside to your firebase project name you just created.
4. Make sure you use a SCSS compiler. For VSCode I recommend `Easy Sass` or `Live Sass Compiler` extension.
5. Run `firebase serve` to start a local server on port 5000. Use ctrl+c to stop it.
6. Make sure to install `Prettier`. Its a code formatter, and it will make sure that we avoid any whitespace or formatting issues when merging code.

That should be it. If you run into any problems, let me know.
