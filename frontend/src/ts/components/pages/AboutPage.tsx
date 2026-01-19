import { createEffect, createResource, For, JSXElement, Show } from "solid-js";
import { Button } from "../common/Button";
import { showModal } from "../../stores/modals";
import AsyncContent from "../common/AsyncContent";
import { getActivePage } from "../../signals/core";
import { getAds } from "../../signals/config";
import { getContributorsList, getSupportersList } from "../../utils/json-data";
import Ape from "../../ape";
import { intervalToDuration } from "date-fns";
import { getNumberWithMagnitude, numberWithSpaces } from "../../utils/numbers";
import { ChartJs } from "../common/ChartJs";
import { getThemeColors } from "../../signals/theme";

function H2(props: { icon: string; text: string }): JSXElement {
  return (
    <h2 class="flex place-items-center gap-4 pb-4 text-4xl text-sub">
      <i class={props.icon}></i>
      {props.text}
    </h2>
  );
}

function H3(props: { icon: string; text: string }): JSXElement {
  return (
    <h3 class="flex place-items-center gap-2 pb-2 text-sub">
      <i class={props.icon}></i>
      {props.text}
    </h3>
  );
}

export function AboutPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "about";
  const [contributors] = createResource(isOpen, async (open) =>
    open ? await getContributorsList() : undefined,
  );
  const [supporters] = createResource(isOpen, async (open) =>
    open ? await getSupportersList() : undefined,
  );

  const [typingStats] = createResource(isOpen, async (open) =>
    open ? await fetchTypingStats() : undefined,
  );

  const [speedHistogram] = createResource(isOpen, async (open) =>
    open ? await fetchSpeedHistogram() : undefined,
  );

  createEffect(() => {
    console.log(getThemeColors());
  });

  return (
    <Show when={isOpen}>
      <section class="text-center text-sub">
        Created with love by Miodec.
        <br />
        <a href="#supporters_title">Supported</a> and{" "}
        <a href="#contributors_title">expanded</a> by many awesome people.
        <br />
        Launched on 15th of May, 2020.
      </section>
      <section>
        <AsyncContent
          alwaysShowContent
          resource={typingStats}
          errorMessage="Failed to get global typing stats"
        >
          {(data) => (
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <For
                each={
                  [
                    ["total tests started", data?.testsStarted],
                    ["total typing time", data?.timeTyping],
                    ["total tests completed", data?.testsCompleted],
                  ] as const
                }
              >
                {([title, data]) => (
                  <div class="text-center">
                    <div class="text-sub">{title}</div>
                    <div class="text-5xl">{data?.text ?? "-"}</div>
                    <div class="text-xl">{data?.subText ?? "-"}</div>
                  </div>
                )}
              </For>
            </div>
          )}
        </AsyncContent>
      </section>
      <section class="h-48 w-full">
        <AsyncContent
          alwaysShowContent
          resource={speedHistogram}
          errorMessage="Failed to get global speed stats for histogram"
        >
          {(data) => (
            <ChartJs
              type="bar"
              data={{
                labels: data?.labels ?? [],
                datasets: [
                  {
                    yAxisID: "count",
                    label: "Users",
                    data: data?.data ?? [],
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                hover: {
                  mode: "nearest",
                  intersect: false,
                },
                scales: {
                  x: {
                    axis: "x",
                    bounds: "ticks",
                    display: true,
                    title: {
                      display: false,
                      text: "Bucket",
                    },
                    offset: true,
                  },
                  count: {
                    axis: "y",
                    beginAtZero: true,
                    min: 0,
                    ticks: {
                      autoSkip: true,
                      autoSkipPadding: 20,
                      stepSize: 10,
                    },
                    display: true,
                    title: {
                      display: true,
                      text: "Users",
                    },
                  },
                },
                plugins: {
                  annotation: {
                    annotations: [],
                  },
                  tooltip: {
                    animation: { duration: 250 },
                    intersect: false,
                    mode: "index",
                  },
                },
              }}
            />
          )}
        </AsyncContent>
        <div class="text-right text-xs text-sub">
          distribution of time 60 leaderboard results (wpm)
        </div>
      </section>
      <section>
        <H2 icon="fas fa-info-circle" text="about" />
        <p>
          Monkeytype is a minimalistic and customizable typing test. It features
          many test modes, an account system to save your typing speed history,
          and user-configurable features such as themes, sounds, a smooth caret,
          and more. Monkeytype attempts to emulate the experience of natural
          keyboard typing during a typing test, by unobtrusively presenting the
          text prompts and displaying typed characters in-place, providing
          straightforward, real-time feedback on typos, speed, and accuracy.
          <br />
          <br />
          Test yourself in various modes, track your progress and improve your
          speed.
        </p>
      </section>
      <section>
        <H3 icon="fas fa-align-left" text="word set" />
        <p>
          By default, this website uses the most common 200 words in the English
          language to generate its tests. You can change to an expanded set
          (1000 most common words) in the options, or change the language
          entirely.
        </p>
      </section>
      <section>
        <H3 icon="fas fa-keyboard" text="keybinds" />
        <p>
          You can use <kbd>tab</kbd> and <kbd>enter</kbd> (or just{" "}
          <kbd>tab</kbd> if you have quick tab mode enabled) to restart the
          typing test. Open the command line by pressing <kbd>ctrl/cmd</kbd> +{" "}
          <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd> - there you can
          access all the functionality you need without touching your mouse.
        </p>
      </section>
      <section>
        <H3 icon="fas fa-list-ol" text="stats" />
        <dl class="grid">
          <dt class="col-1 mr-4">wpm</dt>
          <dd class="col-2">
            - total number of characters in the correctly typed words (including
            spaces), divided by 5 and normalised to 60 seconds.
          </dd>

          <dt class="col-1 mr-4">raw wpm</dt>
          <dd class="col-2">
            {" "}
            - calculated just like wpm, but also includes incorrect words.
          </dd>

          <dt class="col-1 mr-4">acc</dt>
          <dd class="col-2"> - percentage of correctly pressed keys.</dd>

          <dt class="col-1 mr-4">char</dt>
          <dd class="col-2">
            - correct characters / incorrect characters. Calculated after the
            test has ended.
          </dd>

          <dt class="col-1 mr-4">consistency</dt>
          <dd class="col-2">
            - based on the variance of your raw wpm. Closer to 100% is better.
            Calculated using the coefficient of variation of raw wpm and mapped
            onto a scale from 0 to 100.
          </dd>
        </dl>
      </section>
      <Show when={getAds() === "sellout"}>
        <div id="ad-about-1-wrapper" class="ad full-width advertisement ad-h">
          <div class="icon">
            <i class="fas fa-ad"></i>
          </div>
          <div id="ad-about-1"></div>
        </div>
        <div id="ad-about-1-small-wrapper" class="ad advertisement ad-h-s">
          <div class="icon small">
            <i class="fas fa-ad"></i>
          </div>
          <div id="ad-about-1-small"></div>
        </div>
      </Show>
      <section>
        <H3 icon="fas fa-chart-area" text="results screen" />
        <p>
          After completing a test you will be able to see your wpm, raw wpm,
          accuracy, character stats, test length, leaderboards info and test
          info (you can hover over some values to get floating point numbers).
          You can also see a graph of your wpm and raw over the duration of the
          test. Remember that the wpm line is a global average, while the raw
          wpm line is a local, momentary value (meaning if you stop, the value
          is 0).
        </p>
      </section>
      <section>
        <H3 icon="fas fa-bug" text="bug report or feature request" />
        <p>
          If you encounter a bug, or have a feature request - join the Discord
          server, send me an email, a direct message on Twitter or create an
          issue on GitHub.
        </p>
      </section>
      <div></div>
      <section>
        <H2 icon="fas fa-life-ring" text="support" />
        <p>
          Thanks to everyone who has supported this project. It would not be
          possible without you and your continued support.
        </p>
        <div class="mt-4 text-xl">
          <Button
            icon="fas fa-donate"
            onClick={() => showModal("Support")}
            text="support"
            class="w-full p-8"
          />
        </div>
      </section>
      <div></div>
      <section>
        <H2 icon="fas fa-envelope" text="contact" />
        <p>
          If you encounter a bug, have a feature request or just want to say hi
          - here are the different ways you can contact me directly.
        </p>
        <div class="mt-4 grid w-full grid-cols-1 gap-4 text-xl sm:grid-cols-2 lg:grid-cols-4">
          <Button
            text="mail"
            icon="fas fa-envelope"
            onClick={() => showModal("Contact")}
            class="w-full p-8"
          />
          <Button
            text="twitter"
            icon="fab fa-twitter"
            href="https://x.com/monkeytype"
            class="w-full p-8"
          />
          <Button
            text="discord"
            icon="fab fa-discord"
            href="https://discord.gg/monkeytype"
            class="w-full p-8"
          />
          <Button
            text="github"
            icon="fab fa-github"
            href="https://github.com/monkeytypegame/monkeytype"
            class="w-full p-8"
          />
        </div>
      </section>
      <div></div>
      <section>
        <H2 icon="fas fa-users" text="credits" />
        <p>
          <Button
            type="text"
            text="Montydrei"
            href="https://www.reddit.com/user/montydrei"
            class="p-0 pt-2 pr-2 pb-2"
          />
          for the name suggestion
        </p>
        <p>
          <Button
            type="text"
            text="Everyone"
            href="https://www.reddit.com/r/MechanicalKeyboards/comments/gc6wx3/experimenting_with_a_completely_new_type_of/"
            class="p-0 pt-2 pr-2 pb-2"
          />
          who provided valuable feedback on the original reddit post for the
          prototype of this website
        </p>
        <p>
          <Button
            type="text"
            text="Supporters"
            href="#supporters_title"
            class="p-0 pt-2 pr-2 pb-2"
          />
          who helped financially by donating, enabling optional ads or buying
          merch
        </p>
        <p>
          <Button
            type="text"
            text="Contributors"
            href="https://github.com/monkeytypegame/monkeytype/graphs/contributors"
            class="p-0 pt-2 pr-2 pb-2"
          />
          on GitHub that have helped with implementing various features, adding
          themes and more
        </p>
      </section>
      <Show when={getAds() === "sellout"}>
        <div id="ad-about-2-wrapper" class="ad full-width advertisement ad-h">
          <div class="icon">
            <i class="fas fa-ad"></i>
          </div>
          <div id="ad-about-2"></div>
        </div>
        <div id="ad-about-2-small-wrapper" class="ad advertisement ad-h-s">
          <div class="icon small">
            <i class="fas fa-ad"></i>
          </div>
          <div id="ad-about-2-small"></div>
        </div>
      </Show>
      <div></div>
      <section>
        <H2 icon="fas fa-hand-holding-usd" text="top supporters" />
        <AsyncContent
          resource={supporters}
          errorMessage="Failed to get supporters"
        >
          {(data) => (
            <div
              class="grid"
              style={{
                "grid-template-columns": "repeat(auto-fill, minmax(13em, 1fr))",
              }}
            >
              <For each={data}>{(name) => <div>{name}</div>}</For>
            </div>
          )}
        </AsyncContent>
      </section>
      <div></div>
      <section>
        <H2 icon="fas fa-code-branch" text="contributors" />
        <AsyncContent
          resource={contributors}
          errorMessage="Failed to get contributors"
        >
          {(data) => (
            <div
              class="grid"
              style={{
                "grid-template-columns": "repeat(auto-fill, minmax(13em, 1fr))",
              }}
            >
              <For each={data}>{(name) => <div>{name}</div>}</For>
            </div>
          )}
        </AsyncContent>
      </section>
    </Show>
  );
}

type GroupDisplay = {
  label: string;
  text: string;
  subText: string;
};

async function fetchTypingStats(): Promise<{
  timeTyping: GroupDisplay;
  testsStarted: GroupDisplay;
  testsCompleted: GroupDisplay;
}> {
  const response = await Ape.public.getTypingStats();

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }
  const data = response.body.data;

  const typingSecondsRounded = Math.round(data.timeTyping);
  const typingDuration = intervalToDuration({
    start: 0,
    end: typingSecondsRounded * 1000,
  });
  const startedWithMagnitude = getNumberWithMagnitude(data.testsStarted);
  const completedWithMagnitude = getNumberWithMagnitude(data.testsCompleted);

  const result = {
    timeTyping: {
      label:
        numberWithSpaces(Math.round(typingSecondsRounded / 3600)) + " hours",
      text: typingDuration.years?.toString() ?? "",
      subText: "years",
    },
    testsStarted: {
      label: numberWithSpaces(data.testsStarted) + " tests",
      text:
        startedWithMagnitude.rounded < 10
          ? startedWithMagnitude.roundedTo2.toString()
          : startedWithMagnitude.rounded.toString(),
      subText: startedWithMagnitude.orderOfMagnitude,
    },
    testsCompleted: {
      label: numberWithSpaces(data.testsCompleted) + " tests",
      text:
        completedWithMagnitude.rounded < 10
          ? completedWithMagnitude.roundedTo2.toString()
          : completedWithMagnitude.rounded.toString(),
      subText: completedWithMagnitude.orderOfMagnitude,
    },
  };
  return result;
}

async function fetchSpeedHistogram(): Promise<
  | {
      labels: string[];
      data: { x: number; y: number }[];
    }
  | undefined
> {
  const response = await Ape.public.getSpeedHistogram({
    query: {
      language: "english",
      mode: "time",
      mode2: "60",
    },
  });

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }

  const data = response.body.data;

  const histogramChartDataBucketed: { x: number; y: number }[] = [];
  const labels: string[] = [];

  const keys = Object.keys(data).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );
  for (const [i, key] of keys.entries()) {
    const nextKey = keys[i + 1];
    const bucket = parseInt(key, 10);
    histogramChartDataBucketed.push({
      x: bucket,
      y: data[bucket] as number,
    });
    labels.push(`${bucket} - ${bucket + 9}`);
    if (nextKey !== undefined && bucket + 10 !== parseInt(nextKey, 10)) {
      for (let j = bucket + 10; j < parseInt(nextKey, 10); j += 10) {
        histogramChartDataBucketed.push({ x: j, y: 0 });
        labels.push(`${j} - ${j + 9}`);
      }
    }
  }
  return { data: histogramChartDataBucketed, labels };
}
