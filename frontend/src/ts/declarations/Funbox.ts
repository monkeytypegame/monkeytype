
export declare type Funbox =
| "none"
| "nausea"
| "round_round_baby"
| "simon_says"
| "mirror"
| "tts"
| "choo_choo"
| "arrows"
| "rAnDoMcAsE"
| "capitals"
| "layoutfluid"
| "earthquake"
| "space_balls"
| "gibberish"
| "58008"
| "ascii"
| "specials"
| "plus_one"
| "plus_two"
| "read_ahead_easy"
| "read_ahead"
| "read_ahead_hard"
| "memory"
| "nospace"
| "poetry"
| "wikipedia"
| "weakspot"
| "pseudolang";

export declare type FunboxJSONType = "script" | "style";

export declare interface FunboxJSON {
    name: Funbox;
    type: FunboxJSONType;
    info: string;
}