// get the profanities list, and the regex string.
import { profanities, merged, mergedPW, regexProfanities, oldRegexProfanities, PWRegexProfanities } from "./mergeLists";
import {sanitizeString, matchesAPattern} from "./misc";
import engQuotes from "./english.json" assert {type: 'json'};



// Relevant function from monkeytype to test the lists.
const VALID_NAME_PATTERN = /^[\da-zA-Z_.-]+$/;

function inRange(value, min, max) {
  return value >= min && value <= max;
}

export function containsProfanity(text: string, reg: string): boolean {
  const normalizedText = text
    .toLowerCase()
    .split(/[.,"/#!?$%^&*;:{}=\-_`~()\s\n]+/g)
    .map((str) => {
      return sanitizeString(str) ?? "";
    });

  const hasProfanity = regexProfanities.some((profanity) => {
    return normalizedText.some((word) => {
      return matchesAPattern(word, profanity);
    });
  });

  return hasProfanity;
}


// The testing function. compares to english.json list of quotes.
function testData(profanityList, corRegex) {

    // will have sub lists of quotes words split on spaces.
  var newProfanities = [];
  var cleanQuotes = [];

  //
  var falseNegatives = [];
  var falsePositives = [];


  //TEST SECTION: iterate through the list find quotes with profanities from existing list.

  for (let idx = 0; idx < engQuotes.quotes.length; idx++) {

    //check each for profanity. should have none bc they are the currently used english quotes.
    var sublist = engQuotes.quotes[idx].text.split(" ");

    if (containsProfanity(engQuotes.quotes[idx], corRegex)) {
      // quote with profanity. split on space and put list in newProfanities list.
      newProfanities.push.apply(newProfanities, sublist);
    }
    else {
      // Clean quote. Split on space and put new list in cleanQuotes list.
      cleanQuotes.push.apply(cleanQuotes, sublist);
    }

  }


  //Now we have our data. We will parse for false negatives and positives.
  // finding false negatives brute force sanity check: iterate through merged list manually and see if words are in the cleanQuotes list.
  for (var profanity in profanityList) {
    for (var possible = 0; possible < cleanQuotes.length; possible++) {
      for (var word = 0; word < cleanQuotes[possible].length; word++) {
        if(cleanQuotes[possible][word] == profanity)
          falseNegatives.push.apply(falseNegatives, cleanQuotes[possible]);
      }
    }
  }


  // finding false positives brute force sanity check: iterate through merged list manually and see if newProfanities actually has any clean phrases. 
  for (var profanity in profanityList) {
    for (var possible = 0; possible < newProfanities.length; possible++) {
      for (var word = 0; word < newProfanities[possible].length; word++) {
        if(newProfanities[possible][word] == profanity)
          falsePositives.push.apply(falsePositives, newProfanities[possible]);
      }
    }
  }


  // printing test data

  console.log(`quotes without profanities: ${cleanQuotes.length}`);
  console.log(`quotes with profanities: ${newProfanities.length}`);
  console.log(`quotes false negatives: ${falseNegatives.length}`);
  console.log(`quotes false positives: ${falsePositives.length}`);


}// testData




// Run the test scripts.

//original implementation
console.log("data for original implementation");
testData(profanities, oldRegexProfanities);

// Bad-words implementation
console.log("data for Bad-Words implementation");
testData(merged, regexProfanities);

// profane-words implementation
console.log("data for Profane-Words implementation");
testData(mergedPW, PWRegexProfanities);