import { engine } from "animejs";
import { createEffect, JSXElement } from "solid-js";

import { getfpsLimit } from "../../states/fps-limit";
import { isSlowTimer } from "../../test/engine/test-timer";

const SLOW_TIMER_FPS = 30;

/** Applies the fps limit to the animejs engine, capped while the timer is slow. */
export function AnimeEngine(): JSXElement {
  engine.pauseOnDocumentHidden = false;

  createEffect(() => {
    const fps = isSlowTimer() ? SLOW_TIMER_FPS : getfpsLimit();
    engine.fps = fps;
    engine.defaults.frameRate = fps;
  });

  return null;
}
