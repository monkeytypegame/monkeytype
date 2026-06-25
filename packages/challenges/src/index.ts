import { ChallengeName } from "@monkeytype/schemas/challenges";
import { Config, FunboxName } from "@monkeytype/schemas/configs";

export type ChallengeSettings = {
  autoRole?: boolean;
  type:
    | "customTime"
    | "customWords"
    | "customText"
    | "script"
    | "accuracy"
    | "funbox"
    | "other";
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
  parameters: (string | null | number | boolean | FunboxName[])[];
};

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
  settings?: ChallengeSettings;
};

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
      parameters: [69],
      requirements: {
        wpm: { exact: 69 },
        raw: { exact: 69 },
        acc: { exact: 69 },
        con: { exact: 69 },
      },
    },
  },
  "100hours": {
    display: "100 hours",
    isHidden: true,
    discordRoleId: "761766710704603166",
    category: "other",
    description: "Achieve 100 hours of typing.",
  },
  "250hours": {
    display: "250 hours",
    isHidden: true,
    discordRoleId: "799825381733433344",
    category: "other",
    description: "Achieve 250 hours of typing.",
  },
  "500hours": {
    display: "500 hours",
    isHidden: true,
    discordRoleId: "951861792622125106",
    category: "other",
    description: "Achieve 500 hours of typing.",
  },
  "1000hours": {
    display: "1000 hours",
    isHidden: true,
    discordRoleId: "1262175323588395100",
    category: "other",
    description: "Achieve 1000 hours of typing.",
  },
  oneHourWarrior: {
    display: "One Hour Warrior",
    isHidden: true,
    discordRoleId: "728371749737201855",
    category: "endurance",
    description: "Complete an one-hour test.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: [3600],
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
      parameters: [7200],
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
      parameters: [10800],
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
      parameters: [14400],
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
      parameters: [28800],
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
      parameters: [43200],
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
      parameters: [86400],
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
      parameters: ["miodec", "repeat", 10000, "word", false],
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
      parameters: [
        "to of in it is as at be we he so on an or do if up by my go",
        "random",
        100,
        "word",
        false,
      ],
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
      parameters: ["miodec", "repeat", 1000, "word", false],
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
      parameters: ["miodec", "repeat", 100000, "word", false],
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
      parameters: ["antidisestablishmentarianism", "repeat", 1, "word", false],
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
      parameters: ["monkeytype", "repeat", 1000, "word", false],
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
      parameters: ["develop", "repeat", 1000, "word", false],
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
      parameters: [300],
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
      parameters: [
        "a b c d e f g h i j k l m n o p q r s t u v w x y z",
        "random",
        100,
        "word",
        false,
      ],
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
      parameters: ["power", "repeat", 10, "word", false],
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
      parameters: [],
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
      parameters: [],
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
      parameters: [],
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
      parameters: ["episode4.txt", null, ["space_balls"]],
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
      parameters: ["beepboop.txt", null, ["nospace"]],
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
      parameters: ["episode5.txt", null, ["space_balls"]],
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
      parameters: ["episode6.txt", null, ["space_balls"]],
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
      parameters: ["jolly.txt", null, null],
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
      parameters: ["pokemon.txt", null, null],
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
      parameters: ["rapgod.txt", null, null],
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
      parameters: ["navyseal.txt", null, null],
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
    settings: { type: "script", parameters: ["littlechef.txt", null, null] },
  },
  crosstalk: {
    display: "(CROSSTALK)",
    isHidden: true,
    discordRoleId: "761276009664217129",
    category: "script",
    description:
      "Type out the entire transcript of the first 2020 Presidential Debate.",
    settings: { type: "script", parameters: ["crosstalk.txt", null, null] },
  },
  bees: {
    display: "Bees!!!",
    isHidden: true,
    discordRoleId: "739636003182084307",
    category: "script",
    description:
      "Type out the entire Bee Movie script while watching the movie simultaneously.",
    settings: { type: "script", parameters: ["bees.txt", null, null] },
  },
  getOffMySwamp: {
    display: "Get Off My Swamp",
    isHidden: true,
    discordRoleId: "757346966987342026",
    category: "script",
    description:
      "Type out the entire Shrek script with punctuation while watching the movie simultaneously.",
    settings: { type: "script", parameters: ["shrek.txt", null, null] },
  },
  fiftyShadesOfHell: {
    display: "50 Shades of Hell",
    isHidden: true,
    discordRoleId: "751802155119280128",
    category: "script",
    description: "Type out your favourite chapter from 50 Shades of Gray.",
    settings: { type: "script", parameters: [] },
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
      parameters: ["sourcecode.txt", null, null],
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
      parameters: [["layoutfluid"], "time", 60],
    },
  },
  rollercoaster: {
    display: "Rollercoaster",
    isHidden: true,
    discordRoleId: "736032495526740001",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the round round baby mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["round_round_baby"], "time", 3600],
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
    description: "Complete at least an one-hour test using the mirror mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["mirror"], "time", 3600],
      requirements: { time: { min: 3600 }, funbox: { exact: ["mirror"] } },
    },
  },
  chooChoo: {
    display: "Choo choo",
    isHidden: true,
    discordRoleId: "739306439574683710",
    category: "funbox",
    description: "Complete at least an one-hour test using choo choomode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["choo_choo"], "time", 3600],
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
      parameters: [["memory"], "words", 25, "master"],
      requirements: { config: { tapeMode: "off" } },
    },
  },
  earfquake: {
    display: "Earfquake",
    isHidden: true,
    discordRoleId: "740730587429601291",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the earthquake funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["earthquake"], "time", 3600],
      requirements: { time: { min: 3600 }, funbox: { exact: ["earthquake"] } },
    },
  },
  simonSez: {
    display: "Simon Sez",
    isHidden: true,
    discordRoleId: "742128871825997914",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the simon says funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["simon_says"], "time", 3600],
      requirements: { time: { min: 3600 }, funbox: { exact: ["simon_says"] } },
    },
  },
  accountant: {
    display: "Accountant",
    isHidden: true,
    discordRoleId: "743962178821816391",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the 58008 funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["58008"], "time", 3600],
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
      parameters: [["read_ahead"], "time", 60],
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
      parameters: [["read_ahead_hard"], "time", 60],
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
      "Complete at least an one-hour test using the gibberish funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["gibberish"], "time", 3600],
      requirements: { time: { min: 60 }, funbox: { exact: ["gibberish"] } },
    },
  },
  specials: {
    display: "Specials",
    isHidden: true,
    discordRoleId: "744209452714033162",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the specials funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["specials"], "time", 3600],
      requirements: { time: { min: 60 }, funbox: { exact: ["specials"] } },
    },
  },
  aeiou: {
    display: "Aeiou.",
    isHidden: true,
    discordRoleId: "744318102766092362",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the tts funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["tts"], "time", 3600],
      requirements: { time: { min: 60 }, funbox: { exact: ["tts"] } },
    },
  },
  asciiWarrior: {
    display: "ASCII warrior",
    isHidden: true,
    discordRoleId: "746142791326760980",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the ascii funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["ascii"], "time", 3600],
      requirements: { time: { min: 60 }, funbox: { exact: ["ascii"] } },
    },
  },
  iKiNdAlIkEhOwInEfFiCiEnTqWeRtYiS: {
    display: "i KINda LikE HoW inEFFICIeNt QwErtY Is.",
    isHidden: true,
    discordRoleId: "760999194525171724",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the randomcase funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["sPoNgEcAsE"], "time", 3600],
      requirements: { time: { min: 60 }, funbox: { exact: ["sPoNgEcAsE"] } },
    },
  },
  oneNauseousMonkey: {
    display: "One Nauseous Monkey",
    isHidden: true,
    discordRoleId: "760930262740631633",
    category: "funbox",
    description:
      "Complete at least an one-hour test using the nausea funbox mode.",
    settings: {
      autoRole: true,
      type: "funbox",
      parameters: [["nausea"], "time", 3600],
      requirements: { time: { min: 60 }, funbox: { exact: ["nausea"] } },
    },
  },
  thumbWarrior: {
    display: "Thumb Warrior",
    isHidden: true,
    discordRoleId: "761794585109200906",
    category: "other",
    description: "Complete an one-hour test using only your thumbs.",
    settings: { type: "customTime", parameters: [3600] },
  },
  mouseWarrior: {
    display: "Mouse warrior",
    isHidden: true,
    discordRoleId: "744580294442614790",
    category: "other",
    description:
      "Complete an one-hour test using only the on-screen keyboard. Funbox modes are not allowed.",
    settings: { type: "customTime", parameters: [3600] },
  },
  mobileWarrior: {
    display: "Mobile warrior",
    isHidden: true,
    discordRoleId: "744723801526370407",
    category: "other",
    description: "Complete an one-hour test on mobile.",
    settings: { type: "customTime", parameters: [3600] },
  },
  upsideDown: {
    display: "uʍop ǝpᴉsdn",
    isHidden: true,
    discordRoleId: "782725716114014237",
    category: "other",
    description:
      "Achieve at least 60 WPM on an one-minute test with your keyboard upside down.",
    settings: { type: "customTime", parameters: [60] },
  },
  oneArmedBandit: {
    display: "One armed bandit",
    isHidden: true,
    discordRoleId: "765919192557682708",
    category: "other",
    description:
      "Complete an one-hour or 10k words test (whichever comes sooner, using an external timer) using an one-handed words list (either left or right) for your layout.",
    settings: { type: "customWords", parameters: [10000] },
  },
  englishMaster: {
    display: "English master",
    isHidden: true,
    discordRoleId: "751166528824672396",
    category: "other",
    description:
      "Complete an one-hour test using English 10k language with punctuation and numbers enabled.",
    settings: {
      autoRole: true,
      type: "customTime",
      parameters: [3600],
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
    description: "Complete an one-hour test using your feet. Don't ask me why.",
    settings: { type: "customTime", parameters: [3600] },
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
      parameters: [],
      requirements: { acc: { exact: 100 } },
    },
  },
  ultimateMonkeyFlex: {
    display: "Ultimate Monkey Flex",
    isHidden: true,
    discordRoleId: "768497815496032266",
    category: "champions",
    description: "Have the most champion roles in the server.",
  },
  oneRoleToRuleThemAll: {
    display: "One role to rule them all",
    isHidden: true,
    discordRoleId: "758784729151176755",
    category: "champions",
    description: "Have the most challenge roles in the server.",
  },
  doYouKnowTheDefinitionOfInsanity: {
    display: "Do You Know The Definition Of Insanity",
    isHidden: true,
    discordRoleId: "736527448757370880",
    category: "champions",
    description: "Complete the longest typing session in Monkeytype history.",
  },
  oneHourChampion: {
    display: "One Hour Champion",
    isHidden: true,
    discordRoleId: "728650773503934464",
    category: "champions",
    description: "Achieve the highest WPM in an one-hour test.",
  },
  fluidChampion: {
    display: "Fluid Champion",
    isHidden: true,
    discordRoleId: "740568718719058041",
    category: "champions",
    description: "Achieve the highest WPM in a 60-second layoutfluid test.",
  },
  accuracyChampion: {
    display: "Accuracy Champion",
    isHidden: true,
    discordRoleId: "768499906511110235",
    category: "champions",
    description: "Achieve the longest Master mode test.",
  },
  literallyTheFastestPersonHere: {
    display: "Literally The Fastest Person Here",
    isHidden: true,
    discordRoleId: "984922187385405460",
    category: "champions",
    description:
      "Achieve 1st place on the time 60 English all-time leaderboard.",
  },
  bananaHoarder: {
    display: "Banana Hoarder",
    isHidden: true,
    discordRoleId: "773590599227932754",
    category: "champions",
    description: "Achieve 1st place on the banana leaderboard.",
  },
  alpha: {
    display: "A l p h a",
    isHidden: true,
    discordRoleId: "773590612762034176",
    category: "speed",
    description:
      "Type a b c d e f g h i j k l m n o p q r s t u v w x y z in LESS than 3.37 seconds.",
  },
  blazeIt: {
    display: "Blaze It",
    isHidden: true,
    discordRoleId: "803650889461006346",
    category: "speed",
    description: "Achieve 420 WPM (can be rounded) by typing weed.",
  },
  burstMaster: {
    display: "Burst Master",
    isHidden: true,
    discordRoleId: "757330922726096917",
    category: "speed",
    description: "Achieve 200+ WPM on the words 10 mode.",
  },
  burstGod: {
    display: "Burst God",
    isHidden: true,
    discordRoleId: "757330992821305366",
    category: "speed",
    description: "Achieve 250+ WPM on the words 10 mode.",
  },
  shotgun: {
    display: "Shotgun",
    isHidden: true,
    discordRoleId: "757331084366184539",
    category: "speed",
    description: "Achieve 300+ WPM on the words 10 mode.",
  },
  nuke: {
    display: "Nuke",
    isHidden: true,
    discordRoleId: "912522664604758016",
    category: "speed",
    description: "Achieve 350+ WPM on the words 10 mode.",
  },
  orbitalCannon: {
    display: "Orbital Cannon",
    isHidden: true,
    discordRoleId: "1084094136199684196",
    category: "speed",
    description: "Achieve 400+ WPM on the words 10 mode.",
  },
  marathonSprinter: {
    display: "Marathon Sprinter",
    isHidden: true,
    discordRoleId: "878715678830510111",
    category: "speed",
    description: "Achieve 200+ WPM on an one-hour test.",
  },
  flawless: {
    display: "Flawless",
    isHidden: true,
    discordRoleId: "767070815987695637",
    category: "accuracy",
    description:
      "Complete back-to-back tests in Master Mode: 15, 30, 60, 120 seconds and 10, 25, 50, 100 words. If you fail one, restart from the beginning. Order of modes is up to you.",
  },
  hesBeginningToBelieve: {
    display: "He's beginning to believe",
    isHidden: true,
    discordRoleId: "979729541096431688",
    category: "accuracy",
    description:
      "Achieve 100% accuracy in a 2-minute test under specified settings.",
  },
  goldenHands: {
    display: "Golden Hands",
    isHidden: true,
    discordRoleId: "851096860969795684",
    category: "accuracy",
    description: "Complete a 1-hour Master mode test.",
  },
  fingerBlaster: {
    display: "Finger Blaster",
    isHidden: true,
    discordRoleId: "787509606992969728",
    category: "other",
    description:
      "Achieve at least 60 WPM using one finger on a 60-second test.",
  },
  whyAreTheWallsMoving: {
    display: "Why are the walls moving?",
    isHidden: true,
    discordRoleId: "910078947302191114",
    category: "other",
    description: "Complete an one-hour test using tape mode and letter mode.",
  },
  stickman: {
    display: "stickman",
    isHidden: true,
    discordRoleId: "788107449151651890",
    category: "other",
    description:
      "Complete an one-hour test using chopsticks/pencils/pens (you get the idea) with both hands.",
  },
  waveDynamics: {
    display: "Wave Dynamics",
    isHidden: true,
    discordRoleId: "1443311363794407586",
    category: "other",
    description:
      "Achieve 30 wpm 100% acc on a 60 second test with the raw graph being a perfect wave (to achieve this, type 5 characters in 1 second, pause for 1 second, repeat). Must be completed with random words (time 60 mode). Must include words history in the screenshot.",
  },
  apesTogetherStrong: {
    display: "Apes Together Strong",
    isHidden: true,
    discordRoleId: "863193901153779713",
    category: "other",
    description:
      "Complete an one-hour test in a Tribe lobby with at least 10 players.",
  },
  apesTogetherStronger: {
    display: "Apes Together Stronger",
    isHidden: true,
    discordRoleId: "898964842726195220",
    category: "other",
    description:
      "Complete a two-hour test in a Tribe lobby with at least 10 players.",
  },
  apesTogetherInvincible: {
    display: "Apes Together Invincible",
    isHidden: true,
    discordRoleId: "1367559768746758194",
    category: "other",
    description:
      "Complete a three-hour test in a Tribe lobby with at least 10 players.",
  },
  footBarbarian: {
    display: "Foot Barbarian",
    isHidden: true,
    discordRoleId: "1025814170962231336",
    category: "other",
    description: "Complete a two-hour test using your feet.",
  },
  bigFoot: {
    display: "Big Foot",
    isHidden: true,
    discordRoleId: "1030531753082900610",
    category: "other",
    description: "Complete a three-hour test using your feet.",
  },
  woodPecker: {
    display: "Wood Pecker",
    isHidden: true,
    discordRoleId: "753724531666845830",
    category: "other",
    description: "Complete a 200-word test using only your nose.",
  },
  mrWorldwide: {
    display: "Mr Worldwide",
    isHidden: true,
    discordRoleId: "762345904279519292",
    category: "other",
    description:
      "Achieve 100 WPM on a 60-second test in 5 different languages (English, English expanded, English 10k and coding languages all count as English which is 1 language).",
  },
  internalMetronome: {
    display: "Internal Metronome",
    isHidden: true,
    discordRoleId: "934067904884916234",
    category: "other",
    description:
      "Complete a 60-second test (standard English) with a minimum consistency of 90%, 100% accuracy and within 25% of your 60-second personal best.",
  },
  roleCollector: {
    display: "Role Collector",
    isHidden: true,
    discordRoleId: "739306809554108520",
    category: "roleCount",
    description: "Collect 10 roles.",
  },
  roleEnthusiast: {
    display: "Role Enthusiast",
    isHidden: true,
    discordRoleId: "753360663656529931",
    category: "roleCount",
    description: "Collect 20 roles.",
  },
  roleAddict: {
    display: "Role Addict",
    isHidden: true,
    discordRoleId: "758783172833443850",
    category: "roleCount",
    description: "Collect 30 roles.",
  },
  roleOverdose: {
    display: "Role Overdose",
    isHidden: true,
    discordRoleId: "758783365930811423",
    category: "roleCount",
    description: "Collect 40 roles.",
  },
  roleZombie: {
    display: "Role Zombie",
    isHidden: true,
    discordRoleId: "762701731993616405",
    category: "roleCount",
    description: "Collect 50 roles.",
  },
  roleOverlord: {
    display: "Role Overlord",
    isHidden: true,
    discordRoleId: "805519411502514187",
    category: "roleCount",
    description: "Collect 60 roles.",
  },
  roleImp: {
    display: "Role Imp",
    isHidden: true,
    discordRoleId: "906565521271558214",
    category: "roleCount",
    description: "Collect 70 roles.",
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
