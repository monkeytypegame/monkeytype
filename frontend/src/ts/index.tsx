// Import sorting is disabled for this file (.oxfmtrc.json): many imports run
// side effects on load, so their order matters.

// register signal tracking hook before any signals are created
import "./dev/signal-tracker";

//enable solidjs-devtools
import "solid-devtools";

import "./event-handlers/global";

// starts the user data load on sign in, before auth can report one
import "./session-data";
import "./console-globals";
import "./controllers/ad-controller";
import "./test/tts";
import { render } from "solid-js/web";
import { App } from "./components/core/App";
import { boot } from "./boot";

import "./input/hotkeys";

// Lock Math.random
Object.defineProperty(Math, "random", {
  value: Math.random,
  writable: false,
  configurable: false,
  enumerable: true,
});

// Freeze Math object
Object.freeze(Math);

// Lock Math on window
Object.defineProperty(window, "Math", {
  value: Math,
  writable: false,
  configurable: false,
  enumerable: true,
});

if (import.meta.env.DEV) {
  void import("./dev/expose");
}

// render before anything that might touch component-rendered DOM (eg. test page).
// Renders after the static markup in <body> (index.html)
render(() => <App />, document.body);
void boot();
