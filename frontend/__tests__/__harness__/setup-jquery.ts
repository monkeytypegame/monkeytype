import $ from "jquery";

//@ts-expect-error add to global
global["$"] = $;
//@ts-expect-error add to global
global["jQuery"] = $;
