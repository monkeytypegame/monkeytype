### **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Creating Themes](#creating-themes)
- [Commiting Themes](#commiting-themes)
- [Theme Guidelines](#theme-guidelines)

### Forking Monkeytype

First you will have to copy the Monkeytype repository also known as forking. Go to the [Monkeytype Repo](https://github.com/Miodec/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screen Shot 2022-01-12 at 11 51 49 AM" src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Creating Themes

After you have forked the repository you can now add your theme. (If you haven't already forked the repository yet refer to [here](#forking-the-repository).)
Create a file in `./frontend/static/themes/`. Call it whatever you want but make sure that it is all lowercase and underscores for spaces. It should look something like this:
`theme_name.css`.

Then Add this code to your file:

```
:root {
    --bg-color: #ffffff;
    --main-color: #ffffff;
    --caret-color: #ffffff;
    --sub-color: #ffffff;
    --text-color: #ffffff;
    --error-color: #ffffff;
    --error-extra-color: #ffffff;
    --colorful-error-color: #ffffff;
    --colorful-error-extra-color: #ffffff;
  }
```

Here is an image showing what all the colors correspond to:
<img width="1552" alt="Screen Shot 2022-01-12 at 12 01 11 PM" src="https://user-images.githubusercontent.com/83455454/149196967-abb69795-0d38-466b-a867-5aaa46452976.png">

Now change the corresponding hex codes to match your theme. However you aren't done, you need to update one more file. Go to `./frontend/static/themes/_list.json`.
At the very end of the file add this code (Keep it inside the square brackets):

```
,{
    "name": "theme_name",
    "bgColor": "#ffffff",
    "mainColor": "#ffffff"
}
```

Make sure the name you put is lowercase and has underscores for spaces. Add the text color and background color of your theme to the varibles.

### Commiting Themes

Once you have created your theme(s) you now need to create a pull request on the main Monkeytype repository. Go to the branch where you created your themes on GitHub.
Then make sure your branch is up to date. Once it is up to date click contribute.

Update branch:
<img width="1552" alt="Screen Shot 2022-01-12 at 10 55 19 AM" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screen Shot 2022-01-12 at 10 56 42 AM" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

After that add some screenshots of your theme to the pull request. Click create pull request and if it gets approved
then your new theme is on Monkeytype.

## Theme Guidelines

Make sure your theme follows the theme guidelines.
[Theme guidelines](https://github.com/Miodec/monkeytype/blob/master/CONTRIBUTING.md#theme-guidelines)
