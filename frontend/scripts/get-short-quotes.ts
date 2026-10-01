import { QuoteData } from "@monkeytype/schemas/quotes";
import * as fs from "fs";

import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "..");

async function getShortQuotes(): Promise<void> {
  const shortQuotes = {} as Record<QuoteData["language"], number[]>;
  let count = 0;
  const quotesFiles = fs.readdirSync(
    path.resolve(FRONTEND_ROOT, "static/quotes"),
  );
  for (const quotefilename of quotesFiles) {
    const quoteJson = fs.readFileSync(
      path.resolve(FRONTEND_ROOT, `static/quotes/${quotefilename}`),
      "utf8",
    );
    //const quoteJson = await (await fetch(`https://raw.githubusercontent.com/monkeytypegame/monkeytype/refs/heads/master/frontend/static/quotes/${quotefilename}`)).json();
    const quoteData = JSON.parse(quoteJson) as QuoteData;
    for (const quote of quoteData.quotes) {
      if (quote.length < 60) {
        shortQuotes[quoteData.language] ??= [];
        shortQuotes[quoteData.language].push(quote.id);
        count++;
      }
    }
  }
  fs.writeFileSync(
    path.resolve(__dirname, "short-quotes.json"),
    JSON.stringify(shortQuotes),
  );
  console.log(`There are ${count} allowed short quotes`);
}

void getShortQuotes();
