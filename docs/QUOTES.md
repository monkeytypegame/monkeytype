### **Table of Contents**

- [Forking Monkeytype](#forking-monkeytype)
- [Creating Quotes](#creating-quotes)
- [Committing Quotes](#committing-quotes)
- [Quote Guidelines](#quote-guidelines)

### Forking Monkeytype

First you will have to copy the Monkeytype repository also known as forking. Go to the [Monkeytype Repo](https://github.com/monkeytypegame/monkeytype/) and then click the "fork" button.

<img width="1552" alt="Screen Shot 2022-01-12 at 11 51 49 AM" src="https://user-images.githubusercontent.com/83455454/149194972-23343642-7a1f-4c0c-b5f2-36f4b39a2639.png">

## Creating Quotes

After you forked the Monkeytype repository you can now add your quotes. (If you haven't already forked the repository, refer to this [section](#forking-monkeytype).) (Before continuing to the next step make sure the quote's language exists in Monkeytype) Add this code in at the end of the quotes `./frontend/static/quotes/[language].json`:

```json
{
    "text": "[quote]",
    "source": "[source]",
    "id": [number of the quote],
    "length": [number of characters in quote]
}
```

If the language does exist in Monkeytype, but there are no quotes for it create a new file for the language.

### Committing Quotes

Once you have added your quote(s), you now need to create a pull request to the main Monkeytype repository. Go to the branch where you added your quotes on GitHub. Then make sure your branch is up to date. Once it is up to date, click "contribute".

Update branch:
<img width="1552" alt="Screenshot showing how to update the fork to match the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186547-5b9fe4fd-b944-4eed-a959-db43f96198bf.png">

Create a pull request:
<img width="1552" alt="Screenshot showing how to create a pull request to the main Monkeytype repository" src="https://user-images.githubusercontent.com/83455454/149186637-66dae488-05ae-45c4-9217-65bc36c4927b.png">

## Quote Guidelines

- Do not include content that contains any libelous or otherwise unlawful, abusive, or obscene text.
- Ensure that your contribution meets JSON standards (no trailing comma at the end of a list)
- Verify quotes added aren't duplicates of any already present
- Verify the `length` property is correct (length of the text in characters)
- Verify the `id` property is incremented correctly
- Please do not add extremely short quotes (less than 60 characters)
- For quotes not in English, please include translations of quotes in the description of your pull request. This assists in the verification process to ensure the integrity of the quotes.
- Remember to name your pull request properly. For example, if you are adding new quotes for the language `French`, your pull request should be named `impr(quotes): add French quotes`.
