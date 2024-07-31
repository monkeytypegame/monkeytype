import * as ThemeColors from "./theme-colors";
import * as SlowTimer from "../states/slow-timer";
import Config from "../config";

type Particle = {
  x: number;
  y: number;
  color: string;
  alpha: number;
  prev: { x: number; y: number };
  vel: { x: number; y: number };
};

type CTX = {
  particles: Particle[];
  caret?: JQuery;
  canvas?: HTMLCanvasElement;
  context2d?: CanvasRenderingContext2D;
  rendering: boolean;
  lastFrame?: number;
  deltaTime?: number;
  resetTimeOut?: number;
};

/**
 * @typedef {{ x: number, y: number }} vec2
 * @typedef {vec2 & { prev: vec2, vel: vec2, alpha: number, color: string }} Particle
 * @typedef {{ particles: Particle[], caret: any, canvas: HTMLCanvasElement, context2d: CanvasRenderingContext2D, rendering: boolean, lastFrame: number, deltaTime: number, resetTimeOut: number }} CTX
 */

/**
 * @type {CTX} ctx
 */
const ctx: CTX = {
  particles: [],
  rendering: false,
};
const gravity = 1000;
const drag = 0.05;
const particleSize = 4;
const particleFade = 0.6;
const particleInitVel = 1500;
const particleBounceMod = 0.3;
const particleCreateCount: [number, number] = [6, 3];
const shakeAmount = 10;

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;top:0;left:0;pointer-events:none;z-index:999999";
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  window.addEventListener("resize", () => {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
  });

  document.body.appendChild(canvas);

  return canvas;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @returns {Particle}
 */
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

/**
 * @param {Particle} particle
 */
function updateParticle(particle: Particle): void {
  if (!ctx.canvas || !ctx.deltaTime) return;

  particle.prev.x = particle.x;
  particle.prev.y = particle.y;
  // Update pos
  particle.x += particle.vel.x * ctx.deltaTime;
  particle.y += particle.vel.y * ctx.deltaTime;

  if (particle.x > ctx.canvas.width) {
    particle.vel.x *= -particleBounceMod;
    particle.x =
      ctx.canvas.width - (particle.x - ctx.canvas.width) * particleBounceMod;
  } else if (particle.x < 0) {
    particle.vel.x *= -particleBounceMod;
    particle.x *= -particleBounceMod;
  }
  if (particle.y > ctx.canvas.height) {
    particle.vel.y *= -particleBounceMod;
    particle.y =
      ctx.canvas.height - (particle.y - ctx.canvas.height) * particleBounceMod;
  } else if (particle.y < 0) {
    particle.vel.y *= -1;
    particle.y *= -1;
  }

  particle.vel.y += gravity * ctx.deltaTime;
  particle.vel.x *= 1 - drag * ctx.deltaTime;

  particle.alpha *= 1 - particleFade * ctx.deltaTime;
}

export function init(): void {
  ctx.caret = $("#caret");
  ctx.canvas = createCanvas();
  ctx.context2d = ctx.canvas.getContext("2d") as CanvasRenderingContext2D;
}

function render(): void {
  if (!ctx.lastFrame || !ctx.context2d || !ctx.canvas) return;
  ctx.rendering = true;
  const time = Date.now();
  ctx.deltaTime = (time - ctx.lastFrame) / 1000;
  ctx.lastFrame = time;

  ctx.context2d.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const keep = [];
  // for (let i = 0; i < ctx.particles.length; i++) {
  for (const particle of ctx.particles) {
    if (particle.alpha < 0.1) continue;

    updateParticle(particle);

    ctx.context2d.globalAlpha = particle.alpha;
    ctx.context2d.strokeStyle = particle.color;
    ctx.context2d.lineWidth = particleSize;

    ctx.context2d.beginPath();
    ctx.context2d.moveTo(
      Math.round(particle.prev.x),
      Math.round(particle.prev.y)
    );
    ctx.context2d.lineTo(Math.round(particle.x), Math.round(particle.y));
    ctx.context2d.stroke();

    keep.push(particle);
  }
  ctx.particles = keep;

  if (ctx.particles.length && !SlowTimer.get()) {
    requestAnimationFrame(render);
  } else {
    ctx.context2d.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.rendering = false;
  }
}

export function reset(immediate = false): void {
  if (!ctx.resetTimeOut) return;
  delete ctx.resetTimeOut;

  clearTimeout(ctx.resetTimeOut);
  const body = $(document.body);
  body.css("transition", "all .25s, transform 0.8s");
  body.css("transform", `translate(0,0)`);
  setTimeout(
    () => {
      body.css("transition", "all .25s, transform .05s");
      $("html").css("overflow", "inherit");
      $("html").css("overflow-y", "scroll");
    },
    immediate ? 0 : 1000
  );
}

function startRender(): void {
  if (!ctx.rendering) {
    ctx.lastFrame = Date.now();
    render();
  }
}

function randomColor(): string {
  const r = Math.floor(Math.random() * 256).toString(16);
  const g = Math.floor(Math.random() * 256).toString(16);
  const b = Math.floor(Math.random() * 256).toString(16);
  return `#${r}${g}${b}`;
}

/**
 * @param {boolean} good Good power or not?
 */
export async function addPower(good = true, extra = false): Promise<void> {
  if (Config.monkeyPowerLevel === "off" || SlowTimer.get()) return;

  if (Config.blindMode) good = true;

  // Shake
  if (["3", "4"].includes(Config.monkeyPowerLevel)) {
    $("html").css("overflow", "hidden");
    const shake = [
      Math.round(shakeAmount - Math.random() * shakeAmount),
      Math.round(shakeAmount - Math.random() * shakeAmount),
    ];
    $(document.body).css(
      "transform",
      `translate(${shake[0]}px, ${shake[1]}px)`
    );
    if (ctx.resetTimeOut) clearTimeout(ctx.resetTimeOut);
    ctx.resetTimeOut = setTimeout(reset, 2000) as unknown as number;
  }

  // Sparks
  const offset = ctx.caret?.offset();
  const coords = [
    offset?.left ?? 0,
    (offset?.top ?? 0) + (ctx.caret?.height() ?? 0),
  ];

  for (
    let i = Math.round(
      (particleCreateCount[0] + Math.random() * particleCreateCount[1]) *
        (extra ? 2 : 1)
    );
    i > 0;
    i--
  ) {
    const color = ["2", "4"].includes(Config.monkeyPowerLevel)
      ? randomColor()
      : good
      ? await ThemeColors.get("caret")
      : await ThemeColors.get("error");
    ctx.particles.push(
      createParticle(...(coords as [x: number, y: number]), color)
    );
  }

  startRender();
}
