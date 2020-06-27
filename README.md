# about
Monkey-type is a minimalistic typing test, featuring many test modes, an account system to save your typing speed history and user configurable features like themes, a smooth caret and more.

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

# keybinds
You can use `tab` and `enter` (or just `tab` if you have quick tab mode enabled) to restart the typing test. Open the command line by pressing `esc` - there you can access all the functionality you need without touching your mouse. 

# stats
- wpm - total amount of characters in the correctly typed words, divided by 5
- acc - percentage of correctly pressed keys
- key - correct characters / incorrect characters. Calculated after the test has ended

# bug report or feature request
If you encounter a bug, or have a feature request - send me a message on Reddit, create an issue on GitHub or send me a message using the command line `esc`.

# credits 
montydrei for the name suggestion
everyone who provided valuable feedback on the original reddit post for the prototype of this website

# support
If you wish to support further development and feeling extra awesome, you can do so [here](https://www.paypal.me/jackbartnik).

# how to contribute
1. Head to [the firebase console](https://console.firebase.google.com/u/0/) and make a new project (the project name doesnt really matter, but just name it `monkey-type`). You dont need to enable analytics for it.
2. Install the [Firebase Command Line Interface](https://firebase.google.com/docs/cli), and use `firebase login` to log in to the same google account as you just used to make the project.
3. Git clone the project and make sure to rename `.firebaserc_example` to `.firebaserc` and changed the project name inside to your firebase project name.
4. Make sure you use a SCSS compiler. For VSCode I recommend `Easy Sass` or `Live Sass Compiler` extension.
5. Run `firebase serve --only hosting` to start a local server on post 5000. Use ctrl+c to stop it.

That should be it. If you run into any problems, let me know.
