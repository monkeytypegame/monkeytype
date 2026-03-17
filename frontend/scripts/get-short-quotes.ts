import * as fs from "fs";
import { QuoteData } from "@monkeytype/schemas/quotes";

async function getShortQuotes(): Promise<void> {
  let shortQuotes: Partial<Record<QuoteData["language"], number[]>> = {};
  let count = 0;
  const quotesFiles = fs.readdirSync("./static/quotes/");
  for (const quotefilename of quotesFiles) {
    const lang = quotefilename.split(".")[0] as QuoteData["language"];
    let quoteData: QuoteData;
    let quoteJson: string;
    quoteJson = fs.readFileSync(`./static/quotes/${lang}.json`, "utf8");
    //quoteJson = await (await fetch(`https://raw.githubusercontent.com/monkeytypegame/monkeytype/refs/heads/master/frontend/static/quotes/${lang}.json`)).json();
    quoteData = JSON.parse(quoteJson) as QuoteData;
    for (const quote of quoteData.quotes) {
      if (quote.length < 60) {
        shortQuotes[lang] ??= [];
        shortQuotes[lang].push(quote.id);
        count++;
      }
    }
  }
  fs.writeFileSync("./scripts/short-quotes.json", JSON.stringify(shortQuotes));
  console.log(`There are ${count} allowed short quotes`);
}

void getShortQuotes();
