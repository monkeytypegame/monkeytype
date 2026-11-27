import { JSXElement, on, onCleanup, onMount, createEffect } from "solid-js";
import { Portal } from "solid-js/web";

import { getConfig } from "../../../config/store";
import { textInsertedEvent } from "../../../input/helpers/after-input";
import { mainCaretPosition } from "../../../states/test";
import { isTestRestarting } from "../../../test/engine/state";
import { isSlowTimer } from "../../../test/engine/test-timer";
import { getTheme } from "../../../theme/state";
import { requestDebouncedAnimationFrame } from "../../../utils/debounced-animation-frame";

type Particle = {
  x: number;
  y: number;
  color: string;
  alpha: number;
  prev: { x: number; y: number };
  vel: { x: number; y: number };
};

const gravity = 1000;
const drag = 0.05;
const particleSize = 4;
const particleFade = 0.6;
const particleInitVel = 1500;
const particleBounceMod = 0.3;
const particleCreateCount: [number, number] = [6, 3];
const shakeAmount = 10;

function createParticle(x: number, y: number, color: string): Particle {
  return {
    x,
    y,
    color,
    alpha: 1,
    prev: { x, y },
    vel: {
      x: particleInitVel - Math.random() * particleInitVel * 2,
      y: particleInitVel - Math.random() * particleInitVel * 2,
    },
  };
}

function randomColor(): string {
  const r = Math.floor(Math.random() * 256).toString(16);
  const g = Math.floor(Math.random() * 256).toString(16);
  const b = Math.floor(Math.random() * 256).toString(16);
  return `#${r}${g}${b}`;
}

/**
 * Monkey power: sparks from the caret on each typed letter (and shakes the
 * page at levels 3 and 4), drawn on a full window canvas it owns.
 */
export function MonkeyPower(): JSXElement {
  let canvas: HTMLCanvasElement | undefined;
  let context2d: CanvasRenderingContext2D | undefined;
  let particles: Particle[] = [];
  let rendering = false;
  let lastFrame = 0;
  let resetTimeout: ReturnType<typeof setTimeout> | undefined;

  const resizeCanvas = (): void => {
    if (!canvas) return;
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
  };

  const updateParticle = (particle: Particle, deltaTime: number): void => {
    if (!canvas) return;

    particle.prev.x = particle.x;
    particle.prev.y = particle.y;
    // Update pos
    particle.x += particle.vel.x * deltaTime;
    particle.y += particle.vel.y * deltaTime;

    if (particle.x > canvas.width) {
      particle.vel.x *= -particleBounceMod;
      particle.x =
        canvas.width - (particle.x - canvas.width) * particleBounceMod;
    } else if (particle.x < 0) {
      particle.vel.x *= -particleBounceMod;
      particle.x *= -particleBounceMod;
    }
    if (particle.y > canvas.height) {
      particle.vel.y *= -particleBounceMod;
      particle.y =
        canvas.height - (particle.y - canvas.height) * particleBounceMod;
    } else if (particle.y < 0) {
      particle.vel.y *= -1;
      particle.y *= -1;
    }

    particle.vel.y += gravity * deltaTime;
    particle.vel.x *= 1 - drag * deltaTime;

    particle.alpha *= 1 - particleFade * deltaTime;
  };

  const render = (): void => {
    if (!context2d || !canvas) return;
    rendering = true;
    const time = Date.now();
    const deltaTime = (time - lastFrame) / 1000;
    lastFrame = time;

    context2d.clearRect(0, 0, canvas.width, canvas.height);

    const keep = [];
    for (const particle of particles) {
      if (particle.alpha < 0.1) continue;

      updateParticle(particle, deltaTime);

      context2d.globalAlpha = particle.alpha;
      context2d.strokeStyle = particle.color;
      context2d.lineWidth = particleSize;

      context2d.beginPath();
      context2d.moveTo(
        Math.round(particle.prev.x),
        Math.round(particle.prev.y),
      );
      context2d.lineTo(Math.round(particle.x), Math.round(particle.y));
      context2d.stroke();

      keep.push(particle);
    }
    particles = keep;

    if (particles.length) {
      requestAnimationFrame(render);
    } else {
      context2d.clearRect(0, 0, canvas.width, canvas.height);
      rendering = false;
    }
  };

  const startRender = (): void => {
    // on first use: most typists never turn monkey power on
    context2d ??= canvas?.getContext("2d") ?? undefined;
    if (!rendering) {
      lastFrame = Date.now();
      render();
    }
  };

  /** Stops shaking the page, if it is. */
  const reset = (immediate = false): void => {
    if (resetTimeout === undefined) return;
    clearTimeout(resetTimeout);
    resetTimeout = undefined;

    document.body.style.transition = "all .25s, transform 0.8s";
    document.body.style.transform = "translate(0,0)";
    setTimeout(
      () => {
        document.body.style.transition = "all .25s, transform .05s";
        document.documentElement.style.overflow = "inherit";
        document.documentElement.style.overflowY = "scroll";
      },
      immediate ? 0 : 1000,
    );
  };

  const addPower = (good: boolean): void => {
    if (getConfig.monkeyPowerLevel === "off" || isSlowTimer()) return;

    requestDebouncedAnimationFrame("monkey-power.addPower", () => {
      if (getConfig.blindMode) good = true;

      // Shake
      if (["3", "4"].includes(getConfig.monkeyPowerLevel)) {
        document.documentElement.style.overflow = "hidden";
        const shake = [
          Math.round(shakeAmount - Math.random() * shakeAmount),
          Math.round(shakeAmount - Math.random() * shakeAmount),
        ];
        document.body.style.transform = `translate(${shake[0]}px, ${shake[1]}px)`;
        if (resetTimeout !== undefined) clearTimeout(resetTimeout);
        resetTimeout = setTimeout(reset, 2000);
      }

      // Sparks, from the caret (the window's corner before it first moves)
      const caret = mainCaretPosition();
      const x = caret ? caret.x - window.scrollX : 0;
      const y = caret ? caret.y - window.scrollY : 0;

      const { caret: caretColor, error } = getTheme();
      for (
        let i = Math.round(
          particleCreateCount[0] + Math.random() * particleCreateCount[1],
        );
        i > 0;
        i--
      ) {
        const color = ["2", "4"].includes(getConfig.monkeyPowerLevel)
          ? randomColor()
          : good
            ? caretColor
            : error;
        particles.push(createParticle(x, y, color));
      }

      startRender();
    });
  };

  onMount(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    const unsubscribe = textInsertedEvent.subscribe(addPower);
    onCleanup(() => {
      window.removeEventListener("resize", resizeCanvas);
      unsubscribe();
      particles = [];
      reset(true);
    });
  });

  // a restart stops the shake
  createEffect(
    on(isTestRestarting, (restarting) => {
      if (restarting) reset();
    }),
  );

  return (
    <Portal>
      <canvas
        ref={(el) => (canvas = el)}
        class="pointer-events-none fixed top-0 left-0 z-999999"
      ></canvas>
    </Portal>
  );
}
