import { ChallengeName } from "@monkeytype/schemas/challenges";
import {
  Config,
  Difficulty,
  FunboxName,
  ThemeName,
} from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { CustomTextLimitMode, CustomTextMode } from "@monkeytype/schemas/util";

export type Challenge = {
  name: ChallengeName;
  display: string;
  description: string;
  isHidden?: boolean;
  discordRoleId: string;
  initialCount: number; //replace this with calculated values after a while
  category:
    | "other"
    | "endurance"
    | "script"
    | "speed"
    | "accuracy"
    | "funbox"
    | "champions"
    | "roleCount";
  settings?: ChallengeSettings;
};

type ChallengeParameter =
  | {
      type: "customTime";
      parameters: { time: number };
    }
  | { type: "customWords"; parameters: { words: number } }
  | {
      type: "customText";
      parameters: {
        text: string;
        mode: CustomTextMode;
        limit: number;
        limitMode: CustomTextLimitMode;
        isPipeDelimiter: boolean;
      };
    }
  | {
      type: "script";
      parameters: {
        script: string;
        theme?: ThemeName;
        funboxes?: FunboxName[];
      };
    }
  | { type: "accuracy" }
  | {
      type: "funbox";
      parameters: {
        funbox: FunboxName;
        difficulty?: Difficulty;
      } & (
        | { mode: "time" | "words"; mode2: number }
        | { mode: Exclude<Mode, "time" | "words"> }
      );
    }
  | { type: "other" };

export type ChallengeSettings = {
  autoRole?: boolean;
  message?: string;
  requirements?: {
    wpm?: { min: number } | { exact: number };
    acc?: { min: number } | { exact: number };
    raw?: { exact: number };
    con?: { exact: number };
    afk?: { max: number };
    time?: { min: number };
    funbox?: { exact: FunboxName[] };
    config?: Partial<Config>;
  };
} & ChallengeParameter;

const challenges: Record<ChallengeName, Omit<Challenge, "name">> = {
  "69": {
    display: "6969696969",
    discordRoleId: "749505965174292511",
    initialCount: 12,
    category: "other",
    description:
      "Complete a 69-second test and achieve 69 WPM, 69 raw, 69% accuracy, and 69% consistency.",
    settings: {
      autoRole: true,
      type: "customTime",
      message:
        "You need to achieve 69 wpm, 69 raw, 69% accuracy and 69% consistency.",
      parameters: { time: 69 },
      requirements: {
        wpm: { exact: 69 },
        raw: { exact: 69 },
        acc: { exact: 69 },
        con: { exact: 69 },
      },
    },
  },
  oneHourWarrior: {
    display: "One Hour Warrior",
    discordRoleId: "728371749737201855",
    initialCount: 794,
    category: "endurance",
    description: "Complete a one-hour test.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: { time: 3600 },
      requirements: { time: { min: 3600 } },
    },
  },
  doubleDown: {
    display: "Double Down",
    discordRoleId: "732008008514535544",
    initialCount: 130,
    category: "endurance",
    description: "Complete a two-hour test.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: { time: 7200 },
      requirements: { time: { min: 7200 } },
    },
  },
  tripleTrouble: {
    display: "Triple Trouble",
    discordRoleId: "732008047618293762",
    initialCount: 57,
    category: "endurance",
    description: "Complete a three-hour test.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: { time: 10800 },
      requirements: { time: { min: 10800 } },
    },
  },
  quad: {
    display: "Quaaaaad",
    discordRoleId: "736215666352455801",
    initialCount: 32,
    category: "endurance",
    description: "Complete a four-hour test.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: { time: 14400 },
      requirements: { time: { min: 14400 } },
    },
  },
  "8Ball": {
    display: "8 Ball",
    discordRoleId: "736528159956271126",
    initialCount: 8,
    category: "endurance",
    description: "Complete an eight-hour test.",
    settings: {
      type: "customTime",
      parameters: { time: 28800 },
      requirements: { time: { min: 28800 } },
    },
  },
  theBig12: {
    display: "The Big 12",
    discordRoleId: "740532256388546581",
    initialCount: 10,
    category: "endurance",
    description: "Complete a twelve-hour test.",
    settings: {
      type: "customTime",
      parameters: { time: 43200 },
      requirements: { time: { min: 43200 } },
    },
  },
  "1Day": {
    display: "1 Day",
    discordRoleId: "751801958511149057",
    initialCount: 4,
    category: "endurance",
    description: "Complete a twenty-four-hour test.",
    settings: {
      type: "customTime",
      parameters: { time: 86400 },
      requirements: { time: { min: 86400 } },
    },
  },
  trueSimp: {
    display: "True Simp",
    discordRoleId: "744328648211038359",
    initialCount: 49,
    category: "script",
    description: "Type miodec ten thousand times.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "miodec",
        mode: "repeat",
        limit: 10000,
        limitMode: "word",
        isPipeDelimiter: false,
      },
    },
  },
  bigramSalad: {
    display: "Bigram Salad",
    discordRoleId: "818535054145093652",
    initialCount: 764,
    category: "speed",
    description:
      "Get 100 WPM on a randomized, 100-word custom test with the words list: to of in it is as at be we he so on an or do if up by my go.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "to of in it is as at be we he so on an or do if up by my go",
        mode: "random",
        limit: 100,
        limitMode: "word",
        isPipeDelimiter: false,
      },
      requirements: { wpm: { min: 100 } },
    },
  },
  simp: {
    display: "Simp",
    discordRoleId: "743854992699687023",
    initialCount: 546,
    category: "script",
    description: "Type miodec one thousand times.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "miodec",
        mode: "repeat",
        limit: 1000,
        limitMode: "word",
        isPipeDelimiter: false,
      },
    },
  },
  simpLord: {
    display: "Simp Lord",
    discordRoleId: "984911956949479445",
    initialCount: 5,
    category: "script",
    description: "Type miodec one hundred thousand times.",
    settings: {
      type: "customText",
      parameters: {
        text: "miodec",
        mode: "repeat",
        limit: 100000,
        limitMode: "word",
        isPipeDelimiter: false,
      },
    },
  },
  antidiseWhat: {
    display: "Antidise-what?",
    discordRoleId: "782006507360616449",
    initialCount: 106,
    category: "script",
    description: "Get at least 200 wpm typing antidisestablishmentarianism.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "antidisestablishmentarianism",
        mode: "repeat",
        limit: 1,
        limitMode: "word",
        isPipeDelimiter: false,
      },
      requirements: { wpm: { min: 200 } },
    },
  },
  whatsThisWebsiteCalledAgain: {
    display: "What's this website called again?",
    discordRoleId: "739276161603076116",
    initialCount: 284,
    category: "script",
    description: "Type monkeytype one thousand times.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "monkeytype",
        mode: "repeat",
        limit: 1000,
        limitMode: "word",
        isPipeDelimiter: false,
      },
    },
  },
  developd: {
    display: "Develop'd",
    discordRoleId: "735964917877964932",
    initialCount: 511,
    category: "script",
    description: "Type develop one thousand times.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "develop",
        mode: "repeat",
        limit: 1000,
        limitMode: "word",
        isPipeDelimiter: false,
      },
    },
  },
  slowAndSteady: {
    display: "Slow and Steady",
    discordRoleId: "782005061935956008",
    initialCount: 45,
    category: "speed",
    description:
      "Complete a 5-minute test with exactly 60 WPM without using the live WPM or pace caret.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: { time: 300 },
      requirements: {
        wpm: { exact: 60 },
        config: { liveSpeedStyle: "off", paceCaret: "off" },
      },
    },
  },
  speedSpacer: {
    display: "Speed Spacer",
    discordRoleId: "755244049446731856",
    initialCount: 79,
    category: "speed",
    description:
      "Get 100 wpm on a randomised custom test with the input: a b c d e f g h i j k l m n o p q r s t u v w x y z (the alphabet) and a word count of 100.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "a b c d e f g h i j k l m n o p q r s t u v w x y z",
        mode: "random",
        limit: 100,
        limitMode: "word",
        isPipeDelimiter: false,
      },
      requirements: { wpm: { min: 100 } },
    },
  },
  iveGotThePower: {
    display: "I've got the POWER",
    discordRoleId: "764879734873915402",
    initialCount: 197,
    category: "speed",
    description: "Get 400 WPM while typing power 10 times.",
    settings: {
      autoRole: true,
      type: "customText",
      parameters: {
        text: "power",
        mode: "repeat",
        limit: 10,
        limitMode: "word",
        isPipeDelimiter: false,
      },
      requirements: { wpm: { min: 400 } },
    },
  },
  accuracyExpert: {
    display: "Accuracy Expert",
    discordRoleId: "751168451263070259",
    initialCount: 23,
    category: "accuracy",
    description: "Complete a 10-minute Master mode test.",
    settings: {
      autoRole: true,
      type: "accuracy",
      message: "Minimum 60wpm and 100% accuracy required.",
      requirements: {
        wpm: { min: 60 },
        acc: { exact: 100 },
        afk: { max: 5 },
        time: { min: 600 },
      },
    },
  },
  accuracyMaster: {
    display: "Accuracy Master",
    discordRoleId: "751168567432708239",
    initialCount: 6,
    category: "accuracy",
    description: "Complete a 20-minute Master mode test.",
    settings: {
      autoRole: true,
      type: "accuracy",
      message: "Minimum 60wpm and 100% accuracy required.",
      requirements: {
        wpm: { min: 60 },
        acc: { exact: 100 },
        afk: { max: 5 },
        time: { min: 1200 },
      },
    },
  },
  accuracyGod: {
    display: "Accuracy God",
    discordRoleId: "751168657626890361",
    initialCount: 5,
    category: "accuracy",
    description: "Complete a 30-minute Master mode test.",
    settings: {
      autoRole: true,
      type: "accuracy",
      message: "Minimum 60wpm and 100% accuracy required.",
      requirements: {
        wpm: { min: 60 },
        acc: { exact: 100 },
        afk: { max: 5 },
        time: { min: 1800 },
      },
    },
  },
  inAGalaxyFarFarAway: {
    display: "In a galaxy far, far away",
    discordRoleId: "740004324301602907",
    initialCount: 8,
    category: "script",
    description:
      "Type out the entire Star Wars Episode 4 script with punctuation while watching the movie simultaneously.",
    settings: {
      type: "script",
      parameters: { script: "episode4.txt", funboxes: ["space_balls"] },
      requirements: { config: { tapeMode: "off" } },
    },
  },
  beepBoop: {
    display: "Beep Boop",
    discordRoleId: "813076265145729024",
    initialCount: 226,
    category: "script",
    description:
      "Type the beepboop script with 100% accuracy and at least 45 WPM.",
    settings: {
      type: "script",
      message: "Mininum 45 WPM and 100% accuracy required.",
      parameters: { script: "beepboop.txt", funboxes: ["nospace"] },
      requirements: {
        wpm: { min: 45 },
        acc: { min: 100 },
        funbox: { exact: ["nospace"] },
      },
    },
  },
  whosYourDaddy: {
    display: "Who's your daddy?",
    discordRoleId: "742171915405361204",
    initialCount: 9,
    category: "script",
    description:
      "Type out the entire Star Wars Episode 5 script with punctuation while watching the movie simultaneously.",
    settings: {
      type: "script",
      parameters: { script: "episode5.txt", funboxes: ["space_balls"] },
      requirements: { config: { tapeMode: "off" } },
    },
  },
  itsATrap: {
    display: "It's a trap!!",
    discordRoleId: "744325174668820550",
    initialCount: 14,
    category: "script",
    description:
      "Type out the entire Star Wars Episode 6 script with punctuation while watching the movie simultaneously.",
    settings: {
      type: "script",
      parameters: { script: "episode6.txt", funboxes: ["space_balls"] },
      requirements: { config: { tapeMode: "off" } },
    },
  },
  jolly: {
    display: "Jolly",
    discordRoleId: "768497412548329563",
    initialCount: 180,
    category: "script",
    description: "Type the Jolly script with a minimum of 70 wpm.",
    settings: {
      autoRole: true,
      type: "script",
      message: "Minimum 70wpm required.",
      parameters: { script: "jolly.txt" },
      requirements: { wpm: { min: 70 } },
    },
  },
  gottaCatchEmAll: {
    display: "Gotta catch 'em all",
    discordRoleId: "767069340599975998",
    initialCount: 473,
    category: "script",
    description: "Type out the names of all Pokemon.",
    settings: {
      autoRole: true,
      type: "script",
      parameters: { script: "pokemon.txt" },
    },
  },
  rapGod: {
    display: "Rap God",
    discordRoleId: "743844891045396603",
    initialCount: 281,
    category: "script",
    description:
      "Type out the lyrics of Eminem's Rap God at a minimum of 85 WPM and 90% accuracy, including punctuation.",
    settings: {
      autoRole: true,
      type: "script",
      message: "Minimum 85wpm and 90% accuracy required.",
      parameters: { script: "rapgod.txt" },
      requirements: { wpm: { min: 85 }, acc: { min: 90 }, afk: { max: 5 } },
    },
  },
  navySeal: {
    display: "Navy Seal",
    discordRoleId: "762345535969165342",
    initialCount: 88,
    category: "script",
    description:
      "Type out the Navy Seal copy pasta with 100% accuracy and minimum 60 WPM.",
    settings: {
      autoRole: true,
      type: "script",
      message: "Minimum 60wpm and 100% accuracy required.",
      parameters: { script: "navyseal.txt" },
      requirements: { wpm: { min: 60 }, acc: { exact: 100 }, afk: { max: 5 } },
    },
  },
  littleChef: {
    display: "Little Chef",
    discordRoleId: "763544714028122153",
    initialCount: 13,
    category: "script",
    description:
      "Type out the entire Ratatouille script while watching the movie simultaneously.",
    settings: { type: "script", parameters: { script: "littlechef.txt" } },
  },
  crosstalk: {
    display: "(CROSSTALK)",
    discordRoleId: "761276009664217129",
    initialCount: 14,
    category: "script",
    description:
      "Type out the entire transcript of the first 2020 Presidential Debate.",
    settings: { type: "script", parameters: { script: "crosstalk.txt" } },
  },
  bees: {
    display: "Bees!!!",
    discordRoleId: "739636003182084307",
    initialCount: 22,
    category: "script",
    description:
      "Type out the entire Bee Movie script while watching the movie simultaneously.",
    settings: { type: "script", parameters: { script: "bees.txt" } },
  },
  getOffMySwamp: {
    display: "Get off my swamp",
    discordRoleId: "757346966987342026",
    initialCount: 14,
    category: "script",
    description:
      "Type out the entire Shrek script with punctuation while watching the movie simultaneously.",
    settings: { type: "script", parameters: { script: "shrek.txt" } },
  },
  lookAtMeIAmTheDeveloperNow: {
    display: "Look at me. I am the developer now.",
    discordRoleId: "937358772635074600",
    initialCount: 4,
    category: "script",
    description:
      "Type out the entire source code of monkeytype, as it was in February 2022.",
    settings: {
      autoRole: true,
      type: "script",
      parameters: { script: "sourcecode.txt" },
    },
  },
  beLikeWater: {
    display: "Be like water",
    discordRoleId: "740568679485276201",
    initialCount: 44,
    category: "funbox",
    description:
      "Achieve at least 50 WPM in all three layouts in a 60-second time test using the layoutfluid mode. Layouts must be unique (e.g., QWERTY, Colemak, Dvorak).",
    settings: {
      type: "funbox",
      message: "Remember: You need to achieve at least 50 wpm in each layout.",
      parameters: { funbox: "layoutfluid", mode: "time", mode2: 60 },
    },
  },
  rollercoaster: {
    display: "Rollercoaster",
    discordRoleId: "736032495526740001",
    initialCount: 45,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the round round baby mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "round_round_baby", mode: "time", mode2: 3600 },
      requirements: {
        time: { min: 3600 },
        funbox: { exact: ["round_round_baby"] },
      },
    },
  },
  oneHourMirror: {
    display: "ɿoɿɿim ɿυoʜ ɘno",
    discordRoleId: "737385182998429757",
    initialCount: 41,
    category: "funbox",
    description: "Complete at least a one-hour test using the mirror mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "mirror", mode: "time", mode2: 3600 },
      requirements: { time: { min: 3600 }, funbox: { exact: ["mirror"] } },
    },
  },
  chooChoo: {
    display: "Choo choo",
    discordRoleId: "739306439574683710",
    initialCount: 60,
    category: "funbox",
    description: "Complete at least a one-hour test using choo choo mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "choo_choo", mode: "time", mode2: 3600 },
      requirements: { time: { min: 3600 }, funbox: { exact: ["choo_choo"] } },
    },
  },
  mnemonist: {
    display: "Mnemonist",
    discordRoleId: "782005606852067328",
    initialCount: 98,
    category: "funbox",
    description:
      "Achieve 100+ WPM with 100% accuracy on a 25-word test using the memory funbox.",
    settings: {
      type: "funbox",
      parameters: {
        funbox: "memory",
        mode: "words",
        mode2: 25,
        difficulty: "master",
      },
      requirements: { config: { tapeMode: "off" } },
    },
  },
  earfquake: {
    display: "Earfquake",
    discordRoleId: "740730587429601291",
    initialCount: 86,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the earthquake funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "earthquake", mode: "time", mode2: 3600 },
      requirements: { time: { min: 3600 }, funbox: { exact: ["earthquake"] } },
    },
  },
  simonSez: {
    display: "Simon Sez",
    discordRoleId: "742128871825997914",
    initialCount: 33,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the simon says funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "simon_says", mode: "time", mode2: 3600 },
      requirements: { time: { min: 3600 }, funbox: { exact: ["simon_says"] } },
    },
  },
  accountant: {
    display: "Accountant",
    discordRoleId: "743962178821816391",
    initialCount: 50,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the 58008 funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "58008", mode: "time", mode2: 3600 },
      requirements: { time: { min: 3600 }, funbox: { exact: ["58008"] } },
    },
  },
  hidden: {
    display: "Hidden",
    discordRoleId: "782006137742557194",
    initialCount: 435,
    category: "funbox",
    description:
      "Achieve 100+ WPM using the read ahead funbox on a 60-second test.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "read_ahead", mode: "time", mode2: 60 },
      requirements: {
        wpm: { min: 100 },
        time: { min: 60 },
        funbox: { exact: ["read_ahead"] },
        config: { tapeMode: "off" },
      },
    },
  },
  iCanSeeTheFuture: {
    display: "I can see the future",
    discordRoleId: "814877508008411226",
    initialCount: 86,
    category: "funbox",
    description:
      "Achieve 100+ WPM using the read ahead hard funbox on a 60-second test.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "read_ahead_hard", mode: "time", mode2: 60 },
      requirements: {
        wpm: { min: 100 },
        time: { min: 60 },
        funbox: { exact: ["read_ahead_hard"] },
        config: { tapeMode: "off" },
      },
    },
  },
  whatAreWordsAtThisPoint: {
    display: "What are words at this point?",
    discordRoleId: "744209241396740176",
    initialCount: 55,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the gibberish funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "gibberish", mode: "time", mode2: 3600 },
      requirements: { time: { min: 60 }, funbox: { exact: ["gibberish"] } },
    },
  },
  specials: {
    display: "Specials",
    discordRoleId: "744209452714033162",
    initialCount: 15,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the specials funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "specials", mode: "time", mode2: 3600 },
      requirements: { time: { min: 60 }, funbox: { exact: ["specials"] } },
    },
  },
  aeiou: {
    display: "Aeiou.",
    discordRoleId: "744318102766092362",
    initialCount: 25,
    category: "funbox",
    description: "Complete at least a one-hour test using the tts funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "tts", mode: "time", mode2: 3600 },
      requirements: { time: { min: 60 }, funbox: { exact: ["tts"] } },
    },
  },
  asciiWarrior: {
    display: "ASCII warrior",
    discordRoleId: "746142791326760980",
    initialCount: 27,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the ascii funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "ascii", mode: "time", mode2: 3600 },
      requirements: { time: { min: 60 }, funbox: { exact: ["ascii"] } },
    },
  },
  iKiNdAlIkEhOwInEfFiCiEnTqWeRtYiS: {
    display: "i KINda LikE HoW inEFFICIeNt QwErtY Is.",
    discordRoleId: "760999194525171724",
    initialCount: 31,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the randomcase funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "sPoNgEcAsE", mode: "time", mode2: 3600 },
      requirements: { time: { min: 60 }, funbox: { exact: ["sPoNgEcAsE"] } },
    },
  },
  oneNauseousMonkey: {
    display: "One Nauseous Monkey",
    discordRoleId: "760930262740631633",
    initialCount: 69,
    category: "funbox",
    description:
      "Complete at least a one-hour test using the nausea funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: { funbox: "nausea", mode: "time", mode2: 3600 },
      requirements: { time: { min: 60 }, funbox: { exact: ["nausea"] } },
    },
  },
  thumbWarrior: {
    display: "Thumb warrior",
    discordRoleId: "761794585109200906",
    initialCount: 12,
    category: "other",
    description: "Complete a one-hour test using only your thumbs.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  mouseWarrior: {
    display: "Mouse warrior",
    discordRoleId: "744580294442614790",
    initialCount: 21,
    category: "other",
    description:
      "Complete a one-hour test using only the on-screen keyboard. Funbox modes are not allowed.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  mobileWarrior: {
    display: "Mobile warrior",
    discordRoleId: "744723801526370407",
    initialCount: 56,
    category: "other",
    description: "Complete a one-hour test on mobile.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  upsideDown: {
    display: "uʍop ǝpᴉsdn",
    discordRoleId: "782725716114014237",
    initialCount: 5,
    category: "other",
    description:
      "Achieve at least 60 WPM on a one-minute test with your keyboard upside down.",
    settings: { type: "customTime", parameters: { time: 60 } },
  },
  oneArmedBandit: {
    display: "One armed bandit",
    discordRoleId: "765919192557682708",
    initialCount: 21,
    category: "other",
    description:
      "Complete a one-hour or 10k words test (whichever comes sooner, using an external timer) using a one-handed words list (either left or right) for your layout.",
    settings: { type: "customWords", parameters: { words: 10000 } },
  },
  englishMaster: {
    display: "English master",
    discordRoleId: "751166528824672396",
    initialCount: 114,
    category: "other",
    description:
      "Complete a one-hour test using English 10k language with punctuation and numbers enabled.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: { time: 3600 },
      requirements: {
        time: { min: 3600 },
        config: { language: "english_10k", punctuation: true, numbers: true },
      },
    },
  },
  feetWarrior: {
    display: "Feet warrior",
    discordRoleId: "751953592860147822",
    initialCount: 6,
    category: "other",
    description: "Complete a one-hour test using your feet. Don't ask me why.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  wingdings: {
    display: "Ten Words of Pain",
    discordRoleId: "863192575984140338",
    initialCount: 48,
    category: "other",
    description:
      "Complete a 10-word Master mode test using the Wingdings custom font.",
    settings: {
      type: "other",
      message:
        "Complete a 10-word Master mode test using the Wingdings custom font. No keymap allowed. Minimum 60 WPM and 100% accuracy required.",
      requirements: { acc: { exact: 100 } },
    },
  },
  "100hours": {
    display: "100 hours",
    discordRoleId: "761766710704603166",
    initialCount: 100,
    category: "other",
    description: "Achieve 100 hours of typing.",
  },
  "250hours": {
    display: "250 hours",
    discordRoleId: "799825381733433344",
    initialCount: 32,
    category: "other",
    description: "Achieve 250 hours of typing.",
  },
  "500hours": {
    display: "500 hours",
    discordRoleId: "951861792622125106",
    initialCount: 8,
    category: "other",
    description: "Achieve 500 hours of typing.",
  },
  "1000hours": {
    display: "1000 hours",
    discordRoleId: "1262175323588395100",
    initialCount: 3,
    category: "other",
    description: "Achieve 1000 hours of typing.",
  },
  ultimateMonkeyFlex: {
    display: "Ultimate Monkey Flex",
    isHidden: true,
    discordRoleId: "768497815496032266",
    initialCount: 1,
    category: "champions",
    description: "Have the most champion roles in the server.",
  },
  oneRoleToRuleThemAll: {
    display: "One role to rule them all",
    isHidden: true,
    discordRoleId: "758784729151176755",
    initialCount: 1,
    category: "champions",
    description: "Have the most challenge roles in the server.",
  },
  doYouKnowTheDefinitionOfInsanity: {
    display: "Do You Know The Definition Of Insanity",
    isHidden: true,
    discordRoleId: "736527448757370880",
    initialCount: 1,
    category: "champions",
    description: "Complete the longest typing session in Monkeytype history.",
  },
  oneHourChampion: {
    display: "One Hour Champion",
    isHidden: true,
    discordRoleId: "728650773503934464",
    initialCount: 1,
    category: "champions",
    description: "Achieve the highest WPM in a one-hour test.",
  },
  fluidChampion: {
    display: "Fluid Champion",
    isHidden: true,
    discordRoleId: "740568718719058041",
    initialCount: 1,
    category: "champions",
    description: "Achieve the highest WPM in a 60-second layoutfluid test.",
  },
  accuracyChampion: {
    display: "Accuracy Champion",
    isHidden: true,
    discordRoleId: "768499906511110235",
    initialCount: 1,
    category: "champions",
    description: "Achieve the longest Master mode test.",
  },
  literallyTheFastestPersonHere: {
    display: "Literally The Fastest Person Here",
    isHidden: true,
    discordRoleId: "984922187385405460",
    initialCount: 1,
    category: "champions",
    description:
      "Achieve 1st place on the time 60 English all-time leaderboard.",
  },
  bananaHoarder: {
    display: "Banana Hoarder",
    isHidden: true,
    discordRoleId: "773590599227932754",
    initialCount: 1,
    category: "champions",
    description: "Achieve 1st place on the banana leaderboard.",
  },
  alpha: {
    display: "A l p h a",
    discordRoleId: "773590612762034176",
    initialCount: 10,
    category: "speed",
    description:
      "Type a b c d e f g h i j k l m n o p q r s t u v w x y z in LESS than 3.37 seconds.",
  },
  blazeIt: {
    display: "Blaze It",
    discordRoleId: "803650889461006346",
    initialCount: 110,
    category: "speed",
    description: "Achieve 420 WPM (can be rounded) by typing weed.",
  },
  burstMaster: {
    display: "Burst Master",
    discordRoleId: "757330922726096917",
    initialCount: 791,
    category: "speed",
    description: "Achieve 200+ WPM on the words 10 mode.",
  },
  burstGod: {
    display: "Burst God",
    discordRoleId: "757330992821305366",
    initialCount: 186,
    category: "speed",
    description: "Achieve 250+ WPM on the words 10 mode.",
  },
  shotgun: {
    display: "Shotgun",
    discordRoleId: "757331084366184539",
    initialCount: 39,
    category: "speed",
    description: "Achieve 300+ WPM on the words 10 mode.",
  },
  nuke: {
    display: "Nuke",
    discordRoleId: "912522664604758016",
    initialCount: 11,
    category: "speed",
    description: "Achieve 350+ WPM on the words 10 mode.",
  },
  orbitalCannon: {
    display: "Orbital Cannon",
    discordRoleId: "1084094136199684196",
    initialCount: 2,
    category: "speed",
    description: "Achieve 400+ WPM on the words 10 mode.",
  },
  marathonSprinter: {
    display: "Marathon Sprinter",
    discordRoleId: "878715678830510111",
    initialCount: 5,
    category: "speed",
    description: "Achieve 200+ WPM on a one-hour test.",
  },
  flawless: {
    display: "Flawless",
    discordRoleId: "767070815987695637",
    initialCount: 45,
    category: "accuracy",
    description:
      "Complete back-to-back tests in Master Mode: 15, 30, 60, 120 seconds and 10, 25, 50, 100 words. If you fail one, restart from the beginning. Order of modes is up to you.",
  },
  hesBeginningToBelieve: {
    display: "He's beginning to believe",
    discordRoleId: "979729541096431688",
    initialCount: 96,
    category: "accuracy",
    description:
      "Achieve 100% accuracy in a 2-minute test under specified settings.",
  },
  goldenHands: {
    display: "Golden Hands",
    discordRoleId: "851096860969795684",
    initialCount: 2,
    category: "accuracy",
    description: "Complete a 1-hour Master mode test.",
  },
  fingerBlaster: {
    display: "Finger Blaster",
    discordRoleId: "787509606992969728",
    initialCount: 7,
    category: "other",
    description:
      "Achieve at least 60 WPM using one finger on a 60-second test.",
  },
  whyAreTheWallsMoving: {
    display: "Why are the walls moving?",
    discordRoleId: "910078947302191114",
    initialCount: 41,
    category: "other",
    description: "Complete a one-hour test using tape mode and letter mode.",
  },
  stickman: {
    display: "stickman",
    discordRoleId: "788107449151651890",
    initialCount: 15,
    category: "other",
    description:
      "Complete a one-hour test using chopsticks/pencils/pens (you get the idea) with both hands.",
  },
  waveDynamics: {
    display: "Wave Dynamics",
    discordRoleId: "1443311363794407586",
    initialCount: 8,
    category: "other",
    description:
      "Achieve 30 wpm 100% acc on a 60 second test with the raw graph being a perfect wave (to achieve this, type 5 characters in 1 second, pause for 1 second, repeat). Must be completed with random words (time 60 mode). Must include words history in the screenshot.",
  },
  apesTogetherStrong: {
    display: "Apes Together Strong",
    discordRoleId: "863193901153779713",
    initialCount: 55,
    category: "other",
    description:
      "Complete a one-hour test in a Tribe lobby with at least 10 players.",
  },
  apesTogetherStronger: {
    display: "Apes Together Stronger",
    discordRoleId: "898964842726195220",
    initialCount: 29,
    category: "other",
    description:
      "Complete a two-hour test in a Tribe lobby with at least 10 players.",
  },
  apesTogetherInvincible: {
    display: "Apes Together Invincible",
    discordRoleId: "1367559768746758194",
    initialCount: 15,
    category: "other",
    description:
      "Complete a three-hour test in a Tribe lobby with at least 10 players.",
  },
  footBarbarian: {
    display: "Foot Barbarian",
    initialCount: 3,
    discordRoleId: "1025814170962231336",
    category: "other",
    description: "Complete a two-hour test using your feet.",
  },
  bigFoot: {
    display: "Big Foot",
    discordRoleId: "1030531753082900610",
    initialCount: 2,
    category: "other",
    description: "Complete a three-hour test using your feet.",
  },
  woodPecker: {
    display: "Wood Pecker",
    discordRoleId: "753724531666845830",
    initialCount: 18,
    category: "other",
    description: "Complete a 200-word test using only your nose.",
  },
  mrWorldwide: {
    display: "Mr Worldwide",
    discordRoleId: "762345904279519292",
    initialCount: 74,
    category: "other",
    description:
      "Achieve 100 WPM on a 60-second test in 5 different languages (English, English expanded, English 10k and coding languages all count as English which is 1 language).",
  },
  internalMetronome: {
    display: "Internal Metronome",
    discordRoleId: "934067904884916234",
    initialCount: 91,
    category: "other",
    description:
      "Complete a 60-second test (standard English) with a minimum consistency of 90%, 100% accuracy and within 25% of your 60-second personal best.",
  },
  roleCollector: {
    display: "Role Collector",
    discordRoleId: "739306809554108520",
    initialCount: 150,
    category: "roleCount",
    description: "Collect 10 roles.",
  },
  roleEnthusiast: {
    display: "Role Enthusiast",
    discordRoleId: "753360663656529931",
    initialCount: 43,
    category: "roleCount",
    description: "Collect 20 roles.",
  },
  roleAddict: {
    display: "Role Addict",
    discordRoleId: "758783172833443850",
    initialCount: 16,
    category: "roleCount",
    description: "Collect 30 roles.",
  },
  roleOverdose: {
    display: "Role Overdose",
    discordRoleId: "758783365930811423",
    initialCount: 12,
    category: "roleCount",
    description: "Collect 40 roles.",
  },
  roleZombie: {
    display: "Role Zombie",
    discordRoleId: "762701731993616405",
    initialCount: 4,
    category: "roleCount",
    description: "Collect 50 roles.",
  },
  roleOverlord: {
    display: "Role Overlord",
    discordRoleId: "805519411502514187",
    initialCount: 3,
    category: "roleCount",
    description: "Collect 60 roles.",
  },
  roleImp: {
    display: "Role Imp",
    discordRoleId: "906565521271558214",
    initialCount: 2,
    category: "roleCount",
    description: "Collect 70 roles.",
  },
  fiftyShadesOfHell: {
    display: "50 Shades of Hell",
    discordRoleId: "751802155119280128",
    initialCount: 71,
    category: "script",
    description: "Type out your favourite chapter from 50 Shades of Gray.",
  },
};

const map: Record<ChallengeName, Challenge> = Object.fromEntries(
  Object.entries(challenges).map(([name, def]) => [name, { ...def, name }]),
) as Record<ChallengeName, Challenge>;

const list: Challenge[] = Object.values(map);
const regular: Challenge[] = list.filter((it) => it.isHidden !== true);

export function getChallenges(): Challenge[] {
  return list;
}

export function getRegularChallenges(): Challenge[] {
  return regular;
}

export function getChallenge(name: ChallengeName): Challenge {
  return map[name];
}
