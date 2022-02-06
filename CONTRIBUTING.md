# Contributing

### **Table of Contents**

- [Getting Started](#getting-started)
    - [Project Structure](#project-structure) 
- [Prerequisites](#prerequisites)
  - [Text Editor](#text-editor)
  - [Git ](#git)
  - [NodeJS and NPM](#nodejs-and-npm)
  - [Firebase](#firebase)
  - [Mongo Setup](#mongo-setup)
- [Building and Running Monkeytype](#building-and-running-monkeytype)
- [Standards and Guidelines](#standards-and-guidelines)
  - [Theme Guidelines](#theme-guidelines)
  - [Language Guidelines](#language-guidelines)
  - [Quote Guidelines](#quote-guidelines)
- [Questions](#questions)

## Getting Started

When contributing to Monkeytype, it's good to know our best practices, tips, and tricks. First, Monkeytype is written in Javascript, CSS, and HTML (in order of language usage within the project); thus, we assume you are comfortable in these languages or have basic knowledge of them. Our backend is in NodeJS and we use MongoDB to store our user data. Furthermore, we use Prettier to format our code.
### Project Structure
The Monkeytype project is quite large in size. This file tree will make it easy for you to get familiar with how it is organized:
<details>
  <summary>Project Structure</summary>
  <!-- this file tree is accurate to commit 0a3741b, if new files are added or deleted, update this by running `tree /f` on Windows, Linux: `tree`, see https://superuser.com/questions/359723/mac-os-x-equivalent-of-the-ubuntu-tree-command for use on Mac -->
  <pre>
Monkeytype:
│   .editorconfig
│   .gitignore
│   .npmrc
│   .nvmrc
│   .prettierignore
│   .prettierrc
│   CODE_OF_CONDUCT.md
│   CONTRIBUTING.md
│   firebase.json
│   gulpfile.js
│   LICENSE
│   package-lock.json
│   package.json
│   README.md
│   SECURITY.md
│   THEMES.md
│
├───.github
│   │   FUNDING.yml
│   │   pull_request_template.md
│   │
│   └───ISSUE_TEMPLATE
│           bug_report.yaml
│           config.yml
│
├───backend
│   │   .eslintrc.json
│   │   .gitignore
│   │   example.env
│   │   server.js
│   │   worker.js
│   │
│   ├───api
│   │   ├───controllers
│   │   │       config.js
│   │   │       core.js
│   │   │       leaderboards.js
│   │   │       new-quotes.js
│   │   │       preset.js
│   │   │       psa.js
│   │   │       quote-ratings.js
│   │   │       quotes.js
│   │   │       result.js
│   │   │       user.js
│   │   │
│   │   ├───routes
│   │   │       config.js
│   │   │       core.js
│   │   │       index.js
│   │   │       leaderboards.js
│   │   │       preset.js
│   │   │       psa.js
│   │   │       quotes.js
│   │   │       result.js
│   │   │       user.js
│   │   │
│   │   └───schemas
│   │           config-schema.js
│   │
│   ├───constants
│   │       base-configuration.js
│   │       quote-languages.js
│   │
│   ├───credentials
│   │       .gitkeep
│   │
│   ├───dao
│   │       bot.js
│   │       config.js
│   │       configuration.js
│   │       leaderboards.js
│   │       new-quotes.js
│   │       preset.js
│   │       psa.js
│   │       public-stats.js
│   │       quote-ratings.js
│   │       report.js
│   │       result.js
│   │       user.js
│   │
│   ├───handlers
│   │       auth.js
│   │       captcha.js
│   │       error.js
│   │       logger.js
│   │       misc.js
│   │       pb.js
│   │       pb_old.js
│   │       validation.js
│   │
│   ├───init
│   │       db.js
│   │       mongodb.js
│   │
│   ├───jobs
│   │       delete-old-logs.js
│   │       index.js
│   │       update-leaderboards.js
│   │
│   └───middlewares
│           api-utils.js
│           auth.js
│           context.js
│           rate-limit.js
│
├───src
│   ├───js
│   │   │   account-controller.js
│   │   │   account.js
│   │   │   axios-instance.js
│   │   │   challenge-controller.js
│   │   │   chart-controller.js
│   │   │   commandline-lists.js
│   │   │   commandline.js
│   │   │   config.js
│   │   │   db.js
│   │   │   exports.js
│   │   │   global-dependencies.js
│   │   │   input-controller.js
│   │   │   layouts.js
│   │   │   mini-result-chart.js
│   │   │   misc.js
│   │   │   monkey-power.js
│   │   │   preset-controller.js
│   │   │   ready.js
│   │   │   replay.js
│   │   │   route-controller.js
│   │   │   settings.js
│   │   │   simple-popups.js
│   │   │   sound.js
│   │   │   tag-controller.js
│   │   │   theme-colors.js
│   │   │   theme-controller.js
│   │   │   ui.js
│   │   │
│   │   ├───account
│   │   │       all-time-stats.js
│   │   │       pb-tables.js
│   │   │       result-filters.js
│   │   │       verification-controller.js
│   │   │
│   │   ├───elements
│   │   │       about-page.js
│   │   │       account-button.js
│   │   │       leaderboards.js
│   │   │       loader.js
│   │   │       loading-page.js
│   │   │       mobile-test-config.js
│   │   │       monkey.js
│   │   │       new-version-notification.js
│   │   │       notifications.js
│   │   │       psa.js
│   │   │       scroll-to-top.js
│   │   │       sign-out-button.js
│   │   │
│   │   ├───popups
│   │   │       contact-popup.js
│   │   │       custom-background-filter.js
│   │   │       custom-test-duration-popup.js
│   │   │       custom-text-popup.js
│   │   │       custom-theme-popup.js
│   │   │       custom-word-amount-popup.js
│   │   │       edit-preset-popup.js
│   │   │       edit-tags-popup.js
│   │   │       import-export-settings-popup.js
│   │   │       pb-tables-popup.js
│   │   │       quote-approve-popup.js
│   │   │       quote-rate-popup.js
│   │   │       quote-report-popup.js
│   │   │       quote-search-popup.js
│   │   │       quote-submit-popup.js
│   │   │       result-tags-popup.js
│   │   │       support-popup.js
│   │   │       version-popup.js
│   │   │       word-filter-popup.js
│   │   │
│   │   ├───settings
│   │   │       language-picker.js
│   │   │       settings-group.js
│   │   │       theme-picker.js
│   │   │
│   │   └───test
│   │           british-english.js
│   │           caps-warning.js
│   │           caret.js
│   │           custom-text.js
│   │           focus.js
│   │           funbox.js
│   │           keymap.js
│   │           layout-emulator.js
│   │           lazy-mode.js
│   │           live-acc.js
│   │           live-burst.js
│   │           live-wpm.js
│   │           manual-restart-tracker.js
│   │           out-of-focus.js
│   │           pace-caret.js
│   │           pb-crown.js
│   │           poetry.js
│   │           practise-words.js
│   │           result.js
│   │           shift-tracker.js
│   │           test-config.js
│   │           test-logic.js
│   │           test-stats.js
│   │           test-timer.js
│   │           test-ui.js
│   │           timer-progress.js
│   │           today-tracker.js
│   │           tts.js
│   │           weak-spot.js
│   │           wikipedia.js
│   │           wordset.js
│   │
│   └───sass
│           about.scss
│           account.scss
│           animations.scss
│           banners.scss
│           caret.scss
│           commandline.scss
│           core.scss
│           footer.scss
│           inputs.scss
│           keymap.scss
│           leaderboards.scss
│           login.scss
│           monkey.scss
│           nav.scss
│           notifications.scss
│           popups.scss
│           scroll.scss
│           settings.scss
│           test.scss
│           z_media-queries.scss
│
└───static
    │   ads.txt
    │   email-handler.html
    │   index.html
    │   manifest.json
    │   privacy-policy.html
    │   robots.txt
    │   security-policy.html
    │   sw.js
    │   terms-of-service.html
    │
    ├───.well-known
    │       security.txt
    │
    ├───about
    │       contributors.json
    │       supporters.json
    │
    ├───challenges
    │       bees.txt
    │       crosstalk.txt
    │       episode4.txt
    │       episode5.txt
    │       episode6.txt
    │       jolly.txt
    │       littlechef.txt
    │       navyseal.txt
    │       pokemon.txt
    │       rapgod.txt
    │       shrek.txt
    │       _list.json
    │
    ├───css
    │       balloon.css
    │       fa.min.css
    │
    ├───fonts
    │       _list.json
    │
    ├───funbox
    │       choo_choo.css
    │       earthquake.css
    │       mirror.css
    │       nausea.css
    │       read_ahead.css
    │       read_ahead_easy.css
    │       read_ahead_hard.css
    │       round_round_baby.css
    │       simon_says.css
    │       space_balls.css
    │       _list.json
    │
    ├───images
    │   │   banana.png
    │   │   carrot.png
    │   │   fav.png
    │   │   githubbanner2.png
    │   │   merchdropwebsite2.png
    │   │   mt-icon-512.png
    │   │   mtsocial.png
    │   │
    │   ├───favicon
    │   │       android-chrome-192x192.png
    │   │       android-chrome-512x512.png
    │   │       apple-touch-icon.png
    │   │       browserconfig.xml
    │   │       favicon-16x16.png
    │   │       favicon-32x32.png
    │   │       favicon.ico
    │   │       mstile-150x150.png
    │   │       mstile-310x150.png
    │   │       mstile-310x310.png
    │   │       mstile-70x70.png
    │   │       safari-pinned-tab.svg
    │   │
    │   └───monkey
    │           m1.png
    │           m1_fast.png
    │           m2.png
    │           m2_fast.png
    │           m3.png
    │           m3_fast.png
    │           m4.png
    │           m4_fast.png
    │
    ├───js
    │       easing.min.js
    │       html2canvas.min.js
    │       jquery-3.5.1.min.js
    │       jquery.color.min.js
    │       jquery.cookie-1.4.1.min.js
    │       moment.min.js
    │
    ├───languages
    │       albanian.json
    │       albanian_1k.json
    │       arabic.json
    │       arabic_10k.json
    │       bangla.json
    │       bangla_10k.json
    │       bangla_letters.json
    │       belarusian_1k.json
    │       britishenglish.json
    │       bulgarian.json
    │       catalan.json
    │       catalan_1k.json
    │       code_bash.json
    │       code_c++.json
    │       code_c.json
    │       code_csharp.json
    │       code_css.json
    │       code_dart.json
    │       code_go.json
    │       code_html.json
    │       code_java.json
    │       code_javascript.json
    │       code_javascript_1k.json
    │       code_kotlin.json
    │       code_pascal.json
    │       code_python.json
    │       code_r.json
    │       code_ruby.json
    │       code_rust.json
    │       code_swift.json
    │       croatian.json
    │       czech.json
    │       czech_10k.json
    │       czech_1k.json
    │       danish.json
    │       danish_10k.json
    │       danish_1k.json
    │       dutch.json
    │       dutch_10k.json
    │       dutch_1k.json
    │       english.json
    │       english_10k.json
    │       english_1k.json
    │       english_25k.json
    │       english_450k.json
    │       english_5k.json
    │       english_commonly_misspelled.json
    │       esperanto.json
    │       esperanto_10k.json
    │       esperanto_1k.json
    │       esperanto_25k.json
    │       esperanto_36k.json
    │       esperanto_h_sistemo.json
    │       esperanto_h_sistemo_10k.json
    │       esperanto_h_sistemo_1k.json
    │       esperanto_h_sistemo_25k.json
    │       esperanto_h_sistemo_36k.json
    │       esperanto_x_sistemo.json
    │       esperanto_x_sistemo_10k.json
    │       esperanto_x_sistemo_1k.json
    │       esperanto_x_sistemo_25k.json
    │       esperanto_x_sistemo_36k.json
    │       estonian.json
    │       estonian_10k.json
    │       estonian_1k.json
    │       filipino.json
    │       filipino_1k.json
    │       finnish.json
    │       finnish_10k.json
    │       finnish_1k.json
    │       french.json
    │       french_10k.json
    │       french_1k.json
    │       french_2k.json
    │       georgian.json
    │       german.json
    │       german_10k.json
    │       german_1k.json
    │       german_250k.json
    │       git.json
    │       greek.json
    │       hebrew.json
    │       hindi.json
    │       hindi_1k.json
    │       hungarian.json
    │       hungarian_2.5k.json
    │       icelandic_1k.json
    │       indonesian.json
    │       indonesian_1k.json
    │       irish.json
    │       italian.json
    │       italian_1k.json
    │       italian_280k.json
    │       italian_60k.json
    │       italian_7k.json
    │       japanese_hiragana.json
    │       japanese_katakana.json
    │       kazakh.json
    │       lithuanian.json
    │       lithuanian_1k.json
    │       lithuanian_3k.json
    │       lojban_cmavo.json
    │       lojban_gismu.json
    │       macedonian.json
    │       macedonian_10k.json
    │       macedonian_1k.json
    │       macedonian_75k.json
    │       malagasy.json
    │       malagasy_1k.json
    │       malay.json
    │       malayalam.json
    │       maori_1k.json
    │       mongolian.json
    │       mongolian_10k.json
    │       norwegian.json
    │       norwegian_10k.json
    │       norwegian_1k.json
    │       norwegian_5k.json
    │       persian.json
    │       pig_latin.json
    │       pinyin.json
    │       pinyin_10k.json
    │       pinyin_1k.json
    │       polish.json
    │       polish_200k.json
    │       polish_2k.json
    │       portuguese.json
    │       portuguese_3k.json
    │       romanian.json
    │       russian.json
    │       russian_10k.json
    │       russian_1k.json
    │       serbian.json
    │       slovak.json
    │       slovak_10k.json
    │       slovak_1k.json
    │       slovenian.json
    │       spanish.json
    │       spanish_10k.json
    │       spanish_1k.json
    │       swahili_1k.json
    │       swedish.json
    │       swedish_1k.json
    │       swiss_german.json
    │       swiss_german_1k.json
    │       tamil.json
    │       thai.json
    │       toki_pona.json
    │       turkish.json
    │       turkish_1k.json
    │       twitch_emotes.json
    │       ukrainian.json
    │       ukrainian_10k.json
    │       ukrainian_1k.json
    │       ukrainian_50k.json
    │       urdu.json
    │       urdu_1k.json
    │       urdu_5k.json
    │       vietnamese.json
    │       vietnamese_1k.json
    │       vietnamese_5k.json
    │       welsh.json
    │       welsh_1k.json
    │       yoruba_1k.json
    │       _groups.json
    │       _list.json
    │       _unused.txt
    │
    ├───quotes
    │       albanian.json
    │       arabic.json
    │       code_c++.json
    │       code_c.json
    │       code_java.json
    │       code_javascript.json
    │       code_python.json
    │       code_rust.json
    │       czech.json
    │       danish.json
    │       dutch.json
    │       english.json
    │       filipino.json
    │       french.json
    │       german.json
    │       hindi.json
    │       icelandic.json
    │       indonesian.json
    │       irish.json
    │       italian.json
    │       lithuanian.json
    │       malagasy.json
    │       polish.json
    │       portuguese.json
    │       russian.json
    │       serbian.json
    │       slovak.json
    │       spanish.json
    │       swedish.json
    │       thai.json
    │       tokipona.json
    │       turkish.json
    │       vietnamese.json
    │
    ├───sound
    │   │   error.wav
    │   │
    │   ├───click1
    │   │       click1_1.wav
    │   │       click1_2.wav
    │   │       click1_3.wav
    │   │
    │   ├───click2
    │   │       click2_1.wav
    │   │       click2_2.wav
    │   │       click2_3.wav
    │   │
    │   ├───click3
    │   │       click3_1.wav
    │   │       click3_2.wav
    │   │       click3_3.wav
    │   │
    │   ├───click4
    │   │       click4_1.wav
    │   │       click4_11.wav
    │   │       click4_2.wav
    │   │       click4_22.wav
    │   │       click4_3.wav
    │   │       click4_33.wav
    │   │       click4_4.wav
    │   │       click4_44.wav
    │   │       click4_5.wav
    │   │       click4_55.wav
    │   │       click4_6.wav
    │   │       click4_66.wav
    │   │
    │   ├───click5
    │   │       click5_1.wav
    │   │       click5_11.wav
    │   │       click5_2.wav
    │   │       click5_22.wav
    │   │       click5_3.wav
    │   │       click5_33.wav
    │   │       click5_4.wav
    │   │       click5_44.wav
    │   │       click5_5.wav
    │   │       click5_55.wav
    │   │       click5_6.wav
    │   │       click5_66.wav
    │   │
    │   ├───click6
    │   │       click6_1.wav
    │   │       click6_11.wav
    │   │       click6_2.wav
    │   │       click6_22.wav
    │   │       click6_3.wav
    │   │       click6_33.wav
    │   │
    │   └───click7
    │           click7_1.wav
    │           click7_11.wav
    │           click7_2.wav
    │           click7_22.wav
    │           click7_3.wav
    │           click7_33.wav
    │
    ├───themes
    │       8008.css
    │       80s_after_dark.css
    │       9009.css
    │       aether.css
    │       alduin.css
    │       alpine.css
    │       arch.css
    │       aurora.css
    │       beach.css
    │       bento.css
    │       bingsu.css
    │       bliss.css
    │       blueberry_dark.css
    │       blueberry_light.css
    │       botanical.css
    │       bouquet.css
    │       bushido.css
    │       cafe.css
    │       camping.css
    │       carbon.css
    │       catppuccin.css
    │       chaos_theory.css
    │       comfy.css
    │       copper.css
    │       creamsicle.css
    │       cyberspace.css
    │       dark.css
    │       dark_magic_girl.css
    │       darling.css
    │       deku.css
    │       desert_oasis.css
    │       dev.css
    │       diner.css
    │       dmg.css
    │       dollar.css
    │       dots.css
    │       dracula.css
    │       drowning.css
    │       dualshot.css
    │       evil_eye.css
    │       ez_mode.css
    │       fire.css
    │       fledgling.css
    │       fleuriste.css
    │       froyo.css
    │       frozen_llama.css
    │       fruit_chew.css
    │       fundamentals.css
    │       future_funk.css
    │       godspeed.css
    │       graen.css
    │       grand_prix.css
    │       gruvbox_dark.css
    │       gruvbox_light.css
    │       hammerhead.css
    │       hanok.css
    │       honey.css
    │       horizon.css
    │       iceberg_dark.css
    │       iceberg_light.css
    │       ishtar.css
    │       joker.css
    │       laser.css
    │       lavender.css
    │       leather.css
    │       lil_dragon.css
    │       lime.css
    │       luna.css
    │       magic_girl.css
    │       mashu.css
    │       matcha_moccha.css
    │       material.css
    │       matrix.css
    │       menthol.css
    │       metaverse.css
    │       metropolis.css
    │       miami.css
    │       miami_nights.css
    │       midnight.css
    │       milkshake.css
    │       mint.css
    │       mizu.css
    │       modern_dolch.css
    │       modern_ink.css
    │       monokai.css
    │       moonlight.css
    │       mountain.css
    │       mr_sleeves.css
    │       ms_cupcakes.css
    │       muted.css
    │       nausea.css
    │       nautilus.css
    │       nebula.css
    │       night_runner.css
    │       nord.css
    │       norse.css
    │       oblivion.css
    │       olive.css
    │       olivia.css
    │       onedark.css
    │       our_theme.css
    │       paper.css
    │       pastel.css
    │       peaches.css
    │       pink_lemonade.css
    │       pulse.css
    │       red_dragon.css
    │       red_samurai.css
    │       repose_dark.css
    │       repose_light.css
    │       retro.css
    │       retrocast.css
    │       rgb.css
    │       rose_pine.css
    │       rose_pine_dawn.css
    │       rose_pine_moon.css
    │       rudy.css
    │       ryujinscales.css
    │       serika.css
    │       serika_dark.css
    │       sewing_tin.css
    │       sewing_tin_light.css
    │       shadow.css
    │       shoko.css
    │       soaring_skies.css
    │       solarized_dark.css
    │       solarized_light.css
    │       sonokai.css
    │       stealth.css
    │       strawberry.css
    │       striker.css
    │       superuser.css
    │       sweden.css
    │       taro.css
    │       terminal.css
    │       terra.css
    │       terror_below.css
    │       tiramisu.css
    │       trackday.css
    │       trance.css
    │       vaporwave.css
    │       voc.css
    │       vscode.css
    │       watermelon.css
    │       wavez.css
    │       witch_girl.css
    │       _list.json
    │
    └───webfonts
            fa-brands-400.eot
            fa-brands-400.svg
            fa-brands-400.ttf
            fa-brands-400.woff
            fa-brands-400.woff2
            fa-regular-400.eot
            fa-regular-400.svg
            fa-regular-400.ttf
            fa-regular-400.woff
            fa-regular-400.woff2
            fa-solid-900.eot
            fa-solid-900.svg
            fa-solid-900.ttf
            fa-solid-900.woff
            fa-solid-900.woff2

  </pre>
</details>

## Prerequisites

While most contributions don't require that you install dependencies, there are a few tools you will need to be able to run the project (this is useful and almost always necessary for tasks like creating features and fixing bugs; running the project is also useful if you are contributing a theme and want to view it on the site before you contribute it). You will need a computer with a stable internet connection, a text editor, Git, Firebase, and NodeJS with a version < 14.

#### Text Editor

If you are not a developer and wish to contribute themes, new languages, or quotes, having a text editor will make contributions _much_ easier. To make complex edits without installing anything, we recommend using GitHub's VS Code web editor. In your fork of Monkeytype(fork it first), go to the `Code` tab of the repo and press <kbd>.</kbd>(the period/dot key). This will open up the repo in an online VS Code instance you can use to edit files in the browser. Once you are done making your changes, go the to Source Control tab in the activity bar with <kbd>Ctrl/Cmd + Shift + G</kbd>, click the `+` next to the files you've changed to stage them,type a brief message summarizing the changes made in the commit, and press <kbd>Ctrl/Cmd + Enter</kbd> to commit your changes to your fork(send a pull request to the Monkeytype repository when you are ready).

#### Git

Git is optional but we recommend you utilize it. Monkeytype uses the Git source control management system (SCM) for its version control. Assuming you don't have experience typing commands in the command line, we suggest installing [Sourcetree](https://www.sourcetreeapp.com/). You will be able to utilize the power of Git without needing to remember any cryptic commands. However using a Git client won't give you access to the full functionality of Git but provides an easy to understand graphical user interface (GUI). Once you have downloaded Sourcetree, run the installer. While installing Sourcetree, keep your eyes peeled for the option to also install Git with Sourcetree. This is the option you will need to look for in order to install Git. **Make sure to click yes in the installer to install Git with Sourcetree.**

#### NodeJS and NPM

To install NodeJS, navigate to the NodeJS [website](https://nodejs.org/en/) and download the `14.18.1 LTS`.

Alternatively, if you use `nvm` then you can run `nvm install` and `nvm use` (you might need to specify the exact version) to use the version of Node.js in the `.nvmrc` file (if you use Windows, use [nvm-windows](https://github.com/coreybutler/nvm-windows)).

#### Firebase

1. Create a Firebase account if you already haven't done so.
1. [Create a new Firebase project.](https://console.firebase.google.com/u/0/)

   - The project name doesn't matter, but the name `monkeytype` would be preferred.
   - Google Analytics is not necessary.

1. Run `npm install -g firebase-tools` to install the Firebase Command Line Interface.
1. Run `firebase login` on your terminal to log in to the same google account you just used to create the project.
1. Git clone this project.
1. Duplicate `.firebaserc_example`, rename the new file to `.firebaserc` and change the project name of default to the firebase project id you just created.

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
   - Save as `serviceAccountKey.json` inside the `backend/credentials/` directory.

1. Enable Firebase Authentication

   - In the Firebase console, go to `Authentication > Sign-in method`
   - Click on `Email/Password`, enable it, and save
   - Click on `Google`, add a support email and save

#### Mongo Setup

Follow these steps if you want to work on anything involving the database/account system. If not, you can skip this section.

1. Install [MongodDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/) and ensure that it is running

1. Inside the backend folder, copy `example.env` to `.env` in the same directory.

   1. If necessary, uncomment the lines in the `.env` file to use credentials to login to MongoDB.

1. Optional - Install [MongoDB-compass](https://www.mongodb.com/try/download/compass?tck=docs_compass). This tool can be used to see and manipulate your data visually.
   1. To connect, type `mongodb://localhost:27017` in the connection string box and press connect. The monkeytype database will be created and shown` after the server is started`.

## Building and Running Monkeytype

Once you have completed the above steps, you are ready to build and run Monkeytype.

1. Run `npm install` in the project root directory to install dependencies.
1. Run `npm run start:dev` (`npm run start:dev:nodb` if you skipped the mongo section) to start a local dev server on [port 5000](http://localhost:5000). It will watch for changes and rebuild when you edit files in `src/` or `public/` directories. Note that rebuilding doesn't happen instantaneously so be patient for changes to appear. Use <kbd>Ctrl+C</kbd> to kill it.

**Mac Users:** If you get 403 Forbidden errors while trying to access the local server, go into System Preferences > Sharing and disable AirPlay Receiver - it also runs on port 5000 and takes priority, causing 403 errors.

## Standards and Guidelines

Code style is enforced by [Prettier](https://prettier.io/docs/en/install.html), which automatically runs every time you make a commit(`git commit`) (if you've followed the above instructions properly).

We recommend following the guidelines below to increase your chances of getting your change accepted.

#### Theme Guidelines

<!-- TODO: add screenshots to provide examples for dos and don'ts -->

Before submitting a theme make sure...

- your theme is unique and isn't visually similar to any we already have.
- the text color is either black or white (or very close to these colors)
- your theme has been added to the `_list` file and the `textColor` property is the theme's main color
- your theme is clear and readable with both `flip test colors` and `colorful mode` enabled and disabled

(If you want to contribute themes but don't know how to, check [THEMES.md](https://github.com/Miodec/monkeytype/blob/master/THEMES.md))

#### Language Guidelines

- Do not include swear words
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Be sure to add your language to the `_list` and `_groups` files
- Make sure the number of words in the file corresponds to the file name (for example: `languageName.json` is 200 words, `languageName_1k.json` is 1000 words, and so on)

#### Quote Guidelines

- Do not include content that contains any libelous or otherwise unlawful, abusive or obscene text.
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Verify quotes added aren't duplicates of any already present
- Verify the `length` property is correct (length of the text in characters)
- Verify the `id` property is incremented correctly
- Please do not add extremely short quotes (less than 60 characters)

## Questions

If you have any questions, comments, concerns, or problems let me know on [GitHub](https://github.com/Miodec), [Discord](https://discord.gg/monkeytype) in the `#development` channel, or ask a question on Monkeytype's [GitHub discussions](https://github.com/Miodec/monkeytype/discussions) and a contributor will be happy to assist you.
