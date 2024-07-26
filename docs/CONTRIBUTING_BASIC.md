# Contributing - Basic

### **Table of Contents**

- [Basic Contributions](#basic-contributions)
- [Prerequisites](#prerequisites)
- [Contributing](#contributing)
  - [Forking Monkeytype](#forking-monkeytype)
  - [Making a Change](#making-a-change)
  - [Creating a Pull Request](#creating-a-pull-request)
  - [Merging a Pull Request](#merging-a-pull-request)
- [Questions](#questions)

### Basic Contributions

This file details how to create basic contributions to Monkeytype purely through the use of GitHub's web UI. This means you will not need to set up a local development environment of any kind; all you'll need is a browser that can access GitHub and a GitHub account.

Given the above, you should only be using this guide if you plan on making changes that do not impact the functionality of the website. Examples of such cases would be translation fixes, language additions, or quote additions.

For all other changes, please refer to [CONTRIBUTING_ADVANCED.md](./CONTRIBUTING_ADVANCED.md) to learn how to set up the necessary tools to develop on your local environment.

### Prerequisites

You must have a browser that can access GitHub, and possess a GitHub account. Once you have those two things, you're ready to move on to making your contribution(s)!

The steps for basic contributions are showcased splendidly in [this YouTube video](https://www.youtube.com/watch?v=nT8KGYVurIU), so it is recommended you watch it.

## Contributing

### Forking Monkeytype

First, you will have to obtain your own copy of the Monkeytype repository, also known as "forking". Click [here](https://github.com/monkeytypegame/monkeytype/fork) to open the fork wizard or go to the top right of your screen and then click the `fork` button.

<img width="1552" alt="Screenshot showing location of the fork button on GitHub." src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

This will create a clone of the repository under your own account. Navigate to your profile now and click on the new repository called `monkeytype` under your profile.

### Making a Change

There are two methods for making a change in the code.

#### Option 1 - Visual Studio Code Web Editor (Recommended)

If you are not a developer and wish to contribute themes, new languages, or quotes, having a text editor will make contributions _much_ easier. To make complex edits without installing anything, we recommend using GitHub's VS Code web editor. In your fork of Monkeytype (fork it first), go to the `Code` tab of the repo and press <kbd>.</kbd>(the period/dot key). This will open up the repo in an online VS Code instance you can use to edit files in the browser. Once you are done making your changes, go to the Source Control tab in the activity bar with <kbd>Ctrl/Cmd + Shift + G</kbd>, click the `+` next to the files you've changed to stage them, type a brief message summarizing the changes made in the commit, and press <kbd>Ctrl/Cmd + Enter</kbd> to commit your changes to your fork.

Once done, move on to the [next section to create a pull request](#creating-a-pull-request).

#### Option 2 - GitHub Web UI

You're now ready to make a change. Navigate to the file that you're looking to contribute to in your forked repository. Once you navigate to the file, you should see an `Edit` icon (shaped like a pencil) on the right:

<img width="1552" alt="Screenshot showing how to edit files on the GitHub Web UI." src="https://user-images.githubusercontent.com/16960551/167073809-4d53f25a-a0f8-4ca3-98d4-8a77f4d8bb8a.png">

Upon clicking this, you'll have the ability to edit the document itself.

_Note however that some files that are too large might not have this option. In these cases, you will need to download the code and create edits outside of the GitHub web UI. Refer to [CONTRIBUTING_ADVANCED.md](./CONTRIBUTING_ADVANCED.md)_

At this point, you should take a look at [CONTRIBUTING.md](./CONTRIBUTING.md) to view guidelines for theme, language, and quote contributions.

Once you've completed your change, you're ready to commit it. At the bottom of the edit file screen, you will find the commit UI. In the first box, you want to put in a title that describes the change you made. Then in the description field, you can put in any additional detail to supplement your title further.

You will find two radio buttons, one prompts you to commit directly to your current branch, and the other prompts you to create a new branch for your commit and start a pull request. Select the first option to commit the change directly to your current branch.

Click `Commit changes` once you are ready to proceed.

<img width="1552" alt="Screenshot showing how to commit changes on the GitHub Web UI." src="https://user-images.githubusercontent.com/16960551/167233463-fb06e4f8-0699-40ea-9ade-f801898cfc93.png">

### Creating a Pull Request

You can repeat the steps above for as many changes as needed. Once you are done making all your code changes and you have committed them to your branch, you are ready to make a pull request (PR). Go back to the main page of your forked repository. Ensure that your current branch (which is likely still master at this point) is up to date. You can do so by clicking the following button:

Update branch:
<img width="1552" alt="Screenshot showing how to update the fork to match the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Once up to date, you can click the `Contribute` button to open a PR.

Create a pull request:
<img width="1552" alt="Screenshot showing how to create a pull request to the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

Be sure to add a good description to the PR and that the source and destination branches at the top look correct. The `base repository` and `base branch` should be listed as `monkeytypegame/monkeytype` and `master` respectively, and on the right of that should be your forked repository and the branch you have your changes on.

Once done, click on `Create pull request` to officially publish your PR.

### Merging a Pull Request

All you have to do now is wait for approval or comments and go from there!

Once your PR is approved, all that is left to do is merge it!

## Questions

If you have any questions, comments, concerns, or problems, don't hesitate let us know via [email](mailto:jack@monkeytype.com)(to Miodec), on [GitHub](https://github.com/monkeytypegame/monkeytype/discussions) or on [Discord](https://discord.gg/monkeytype) in the [`#development`](https://discord.com/channels/713194177403420752/713196019206324306) channel and a contributor will be happy to assist you.
