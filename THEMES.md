## **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Creating Themes](#creating-themes)
- [Committing Themes](#committing-themes)
- [Theme Guidelines](#theme-guidelines)

## Forking Monkeytype

First, you will have to fork the repository. Go to the [Monkeytype Repository](https://github.com/Miodec/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screenshot showing location of the fork button on GitHub." src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Creating Themes

After you have forked the repository, you can add your new theme. Create a CSS file in `./frontend/static/themes/`. You may name it anything, but make sure it is all lowercase. Use underscores instead of spaces. It should look something like this:
`theme_name.css`.

Then add this code to your file:

```
:root {
    --bg-color: #ffffff;
    --main-color: #ffffff;
    --caret-color: #ffffff;
    --sub-color: #ffffff;
    --sub-alt-color: #ffffff;
    --text-color: #ffffff;
    --error-color: #ffffff;
    --error-extra-color: #ffffff;
    --colorful-error-color: #ffffff;
    --colorful-error-extra-color: #ffffff;
  }
```

Here is an image showing what all the properties correspond to:
<img width="1552" alt="Screenshot showing the page elements controlled by each color property" src="https://user-images.githubusercontent.com/83455454/149196967-abb69795-0d38-466b-a867-5aaa46452976.png">

Change the corresponding hex codes to create your theme. Then, go to `./frontend/static/themes/_list.json` and add the following code to the very end of the file (inside the square brackets):

```
,{
    "name": "theme_name",
    "bgColor": "#ffffff",
    "mainColor": "#ffffff"
}
```

Make sure the name you put matches the name of the file you created (without the `.css` file extension). Add the text color and background color to their respective fields.

## Committing Themes

After creating your theme(s), you need to create a pull request to the Monkeytype repository. Locate the branch that contains your new theme(s) on GitHub. Then make sure it is up to date. Once it is up to date, click "contribute".

Update branch:
<img width="1552" alt="Screenshot showing how to update the fork to match the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screenshot showing how to create a pull request to the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

Add some screenshots of your theme to the pull request. Click "create pull request". If it gets approved, your new theme is available on Monkeytype for everyone to enjoy.

## Theme Guidelines

Make sure your theme follows the theme guidelines.
[Theme guidelines](https://github.com/Miodec/monkeytype/blob/master/CONTRIBUTING.md#theme-guidelines)
