### **Table of Contents**

- [GitHub](#github)
  - [Forking the Repository](#forking-the-repository)
  - [Commiting Themes](#commiting-themes)
- [Creating Themes](#creating-themes)
- [Theme Guidelines](#theme-guidelines)

## GitHub
How to fork the repository and commit your themes to the repository.

### Forking the Repository
Go the the [Monkeytype Repo](https://github.com/Miodec/monkeytype/) and then click the "fork" button. And that's it!

### Commiting Themes
Once you have created your theme(s) you now need to create a pull request on the main Monkeytype repository. Go to the branch where you created your themes on GitHub. 
Then make sure your branch is up to date. Once it is up to date click contribute.

Update branch:
<img width="1552" alt="Screen Shot 2022-01-12 at 10 55 19 AM" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create pull request:
<img width="1552" alt="Screen Shot 2022-01-12 at 10 56 42 AM" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

After that add some screenshots of your theme to the pull request. Click create pull request and if it gets approved 
then your new theme is on Monkeytype 

## Creating Themes
After you have forked the repository you can now add your theme. (If you haven't already forked the repository yet refer to [here](#forking-the-repository))
Create a file in ```./static/themes/```. Call it whatever you want but make sure that it is all lowercase and underscores for spaces. It should look something like this:
```theme_name.css```.

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
Now change the corresponding hex codes to match your theme. However you aren't done, you need to update one more file. Go to ```./static/themes/_list.json```.
At the very end of the file add this code (Keep it inside the square brackets):
```
,{
    "name": "theme_name",
    "bgColor": "#ffffff",
    "textColor": "#ffffff"
}
```
Make sure the name you put is lowercase and has underscores for spaces. Add the text color and background color of your theme to the varibles.
After you have commited all of these steps you can now contribute. If you don't know how to refer to [here](#commiting-themes)

## Theme Guidelines
[Theme guidelines](https://github.com/Miodec/monkeytype/blob/master/CONTRIBUTING.md#theme-guidelines)
