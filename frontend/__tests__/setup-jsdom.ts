import $ from "jquery";

//@ts-expect-error add to globl
global["$"] = $;
//@ts-expect-error add to globl
global["jQuery"] = $;
