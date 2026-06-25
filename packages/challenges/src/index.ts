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
  category:
    | "other"
    | "endurance"
    | "script"
    | "speed"
    | "accuracy"
    | "funbox"
    | "champions"
    | "roleCount";
  settings: ChallengeSettings;
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
    isHidden: true,
    discordRoleId: "749505965174292511",
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
    isHidden: true,
    discordRoleId: "728371749737201855",
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
    isHidden: true,
    discordRoleId: "732008008514535544",
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
    isHidden: true,
    discordRoleId: "732008047618293762",
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
    isHidden: true,
    discordRoleId: "736215666352455801",
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
    isHidden: true,
    discordRoleId: "736528159956271126",
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
    isHidden: true,
    discordRoleId: "740532256388546581",
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
    isHidden: true,
    discordRoleId: "751801958511149057",
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
    isHidden: true,
    discordRoleId: "744328648211038359",
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
    isHidden: true,
    discordRoleId: "818535054145093652",
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
    isHidden: true,
    discordRoleId: "743854992699687023",
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
    isHidden: true,
    discordRoleId: "984911956949479445",
    category: "script",
    description: "Type miodec one hundred thousand times.",
    settings: {
      autoRole: false,
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
    isHidden: true,
    discordRoleId: "782006507360616449",
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
    isHidden: true,
    discordRoleId: "739276161603076116",
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
    isHidden: true,
    discordRoleId: "735964917877964932",
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
    isHidden: true,
    discordRoleId: "782005061935956008",
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
    isHidden: true,
    discordRoleId: "755244049446731856",
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
    isHidden: true,
    discordRoleId: "764879734873915402",
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
    isHidden: true,
    discordRoleId: "751168451263070259",
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
    isHidden: true,
    discordRoleId: "751168567432708239",
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
    isHidden: true,
    discordRoleId: "751168657626890361",
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
    isHidden: true,
    discordRoleId: "740004324301602907",
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
    isHidden: true,
    discordRoleId: "813076265145729024",
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
    display: "Who's your daddy",
    isHidden: true,
    discordRoleId: "742171915405361204",
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
    isHidden: true,
    discordRoleId: "744325174668820550",
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
    isHidden: true,
    discordRoleId: "768497412548329563",
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
    display: "Gotta Catch 'Em All",
    isHidden: true,
    discordRoleId: "767069340599975998",
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
    isHidden: true,
    discordRoleId: "743844891045396603",
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
    isHidden: true,
    discordRoleId: "762345535969165342",
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
    isHidden: true,
    discordRoleId: "763544714028122153",
    category: "script",
    description:
      "Type out the entire Ratatouille script while watching the movie simultaneously.",
    settings: { type: "script", parameters: { script: "littlechef.txt" } },
  },
  crosstalk: {
    display: "(CROSSTALK)",
    isHidden: true,
    discordRoleId: "761276009664217129",
    category: "script",
    description:
      "Type out the entire transcript of the first 2020 Presidential Debate.",
    settings: { type: "script", parameters: { script: "crosstalk.txt" } },
  },
  bees: {
    display: "Bees!!!",
    isHidden: true,
    discordRoleId: "739636003182084307",
    category: "script",
    description:
      "Type out the entire Bee Movie script while watching the movie simultaneously.",
    settings: { type: "script", parameters: { script: "bees.txt" } },
  },
  getOffMySwamp: {
    display: "Get Off My Swamp",
    isHidden: true,
    discordRoleId: "757346966987342026",
    category: "script",
    description:
      "Type out the entire Shrek script with punctuation while watching the movie simultaneously.",
    settings: { type: "script", parameters: { script: "shrek.txt" } },
  },
  lookAtMeIAmTheDeveloperNow: {
    display: "Look at me. I am the developer now.",
    isHidden: true,
    discordRoleId: "937358772635074600",
    category: "script",
    description:
      "Type out the entire source code ofMonkeytype, as it was in February 2022.",
    settings: {
      autoRole: true,
      type: "script",
      parameters: { script: "sourcecode.txt" },
    },
  },
  beLikeWater: {
    display: "Be Like Water",
    isHidden: true,
    discordRoleId: "740568679485276201",
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
    isHidden: true,
    discordRoleId: "736032495526740001",
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
    isHidden: true,
    discordRoleId: "737385182998429757",
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
    isHidden: true,
    discordRoleId: "739306439574683710",
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
    isHidden: true,
    discordRoleId: "782005606852067328",
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
    isHidden: true,
    discordRoleId: "740730587429601291",
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
    isHidden: true,
    discordRoleId: "742128871825997914",
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
    isHidden: true,
    discordRoleId: "743962178821816391",
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
    isHidden: true,
    discordRoleId: "782006137742557194",
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
    isHidden: true,
    discordRoleId: "814877508008411226",
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
    display: "What are words at this point",
    isHidden: true,
    discordRoleId: "744209241396740176",
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
    isHidden: true,
    discordRoleId: "744209452714033162",
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
    isHidden: true,
    discordRoleId: "744318102766092362",
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
    isHidden: true,
    discordRoleId: "746142791326760980",
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
    isHidden: true,
    discordRoleId: "760999194525171724",
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
    isHidden: true,
    discordRoleId: "760930262740631633",
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
    display: "Thumb Warrior",
    isHidden: true,
    discordRoleId: "761794585109200906",
    category: "other",
    description: "Complete a one-hour test using only your thumbs.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  mouseWarrior: {
    display: "Mouse warrior",
    isHidden: true,
    discordRoleId: "744580294442614790",
    category: "other",
    description:
      "Complete a one-hour test using only the on-screen keyboard. Funbox modes are not allowed.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  mobileWarrior: {
    display: "Mobile warrior",
    isHidden: true,
    discordRoleId: "744723801526370407",
    category: "other",
    description: "Complete a one-hour test on mobile.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  upsideDown: {
    display: "uʍop ǝpᴉsdn",
    isHidden: true,
    discordRoleId: "782725716114014237",
    category: "other",
    description:
      "Achieve at least 60 WPM on a one-minute test with your keyboard upside down.",
    settings: { type: "customTime", parameters: { time: 60 } },
  },
  oneArmedBandit: {
    display: "One armed bandit",
    isHidden: true,
    discordRoleId: "765919192557682708",
    category: "other",
    description:
      "Complete a one-hour or 10k words test (whichever comes sooner, using an external timer) using a one-handed words list (either left or right) for your layout.",
    settings: { type: "customWords", parameters: { words: 10000 } },
  },
  englishMaster: {
    display: "English master",
    isHidden: true,
    discordRoleId: "751166528824672396",
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
    display: "Foot Warrior",
    isHidden: true,
    discordRoleId: "751953592860147822",
    category: "other",
    description: "Complete a one-hour test using your feet. Don't ask me why.",
    settings: { type: "customTime", parameters: { time: 3600 } },
  },
  wingdings: {
    display: "Ten Words of Pain",
    isHidden: true,
    discordRoleId: "863192575984140338",
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
