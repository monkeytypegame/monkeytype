import $ from "jquery";
import "@testing-library/jest-dom";

//@ts-expect-error add to global
global["$"] = $;
//@ts-expect-error add to global
global["jQuery"] = $;
