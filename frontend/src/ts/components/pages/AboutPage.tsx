import { createEffect, createResource, For, JSXElement, Show } from "solid-js";
import "./AboutPage.scss";
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
import { connections } from "../../signals/connections";
import { isAuthenticated } from "../../signals/user";

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
      <h2>Connections {connections.store.length}</h2>

      <Show when={isAuthenticated()}>
        <Button onClick={() => connections.load()} text="load" />
        <Button onClick={() => connections.reload()} text="reload" />
        <Button onClick={() => connections.reset()} text="reset" />
      </Show>
      <Show when={connections.shouldLoad}>
        <AsyncContent
          resource={connections.resource}
          errorMessage="error loading connections"
        >
          {(data) => (
            <For each={data}>
              {(connection) => (
                <p>
                  {connection.initiatorName} to {connection.receiverName}
                </p>
              )}
            </For>
          )}
        </AsyncContent>
      </Show>

      <div class="created">
        Created with love by Miodec.
        <br />
        <a href="#supporters_title">Supported</a> and{" "}
        <a href="#contributors_title">expanded</a> by many awesome people.
        <br />
        Launched on 15th of May, 2020.
      </div>
      <div class="section histogramChart">
        <AsyncContent
          alwaysShowContent
          resource={typingStats}
          errorMessage="Failed to get global typing stats"
        >
          {(data) => (
            <div class="triplegroup">
              <div
                class="group"
                aria-label={data?.testsStarted.label}
                data-balloon-pos="up"
              >
                <div class="label">total tests started</div>
                <div class="val">{data?.testsStarted.text ?? "-"}</div>
                <div class="valSmall">{data?.testsStarted.subText ?? "-"}</div>
              </div>
              <div
                class="group"
                aria-label={data?.timeTyping.label}
                data-balloon-pos="up"
              >
                <div class="label">total typing time</div>
                <div class="val">{data?.timeTyping.text ?? "-"}</div>
                <div class="valSmall">{data?.timeTyping.subText ?? "-"}</div>
              </div>
              <div
                class="group"
                aria-label={data?.testsCompleted.label}
                data-balloon-pos="up"
              >
                <div class="label">total tests completed</div>
                <div class="val">{data?.testsCompleted.text ?? "-"}</div>
                <div class="valSmall">
                  {data?.testsCompleted.subText ?? "-"}
                </div>
              </div>
            </div>
          )}
        </AsyncContent>
        <div>
          <div class="chart" style={{ height: "200px" }}>
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
          </div>
          <p class="small">distribution of time 60 leaderboard results (wpm)</p>
        </div>
      </div>
      <div class="section">
        <div class="bigtitle">
          <i class="fas fa-info-circle"></i>
          about
        </div>
        <h2>
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
        </h2>
      </div>
      <div class="section">
        <div class="title">
          <i class="fas fa-align-left"></i>
          word set
        </div>
        <p>
          By default, this website uses the most common 200 words in the English
          language to generate its tests. You can change to an expanded set
          (1000 most common words) in the options, or change the language
          entirely.
        </p>
      </div>
      <div class="section">
        <div class="title">
          <i class="fas fa-keyboard"></i>
          keybinds
        </div>
        <p>
          You can use <kbd>tab</kbd> and <kbd>enter</kbd> (or just{" "}
          <kbd>tab</kbd> if you have quick tab mode enabled) to restart the
          typing test. Open the command line by pressing <kbd>ctrl/cmd</kbd> +{" "}
          <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd> - there you can
          access all the functionality you need without touching your mouse.
        </p>
      </div>
      <div class="section">
        <div class="title">
          <i class="fas fa-list-ol"></i>
          stats
        </div>

        <dl>
          <dt>wpm</dt>
          <dd>
            - total number of characters in the correctly typed words (including
            spaces), divided by 5 and normalised to 60 seconds.
          </dd>

          <dt>raw wpm</dt>
          <dd>
            {" "}
            - calculated just like wpm, but also includes incorrect words.
          </dd>

          <dt>acc</dt>
          <dd> - percentage of correctly pressed keys.</dd>

          <dt>char</dt>
          <dd>
            - correct characters / incorrect characters. Calculated after the
            test has ended.
          </dd>

          <dt>consistency</dt>
          <dd>
            - based on the variance of your raw wpm. Closer to 100% is better.
            Calculated using the coefficient of variation of raw wpm and mapped
            onto a scale from 0 to 100.
          </dd>
        </dl>
      </div>
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
      <div class="section">
        <div class="title">
          <i class="fas fa-chart-area"></i>
          results screen
        </div>
        <p>
          After completing a test you will be able to see your wpm, raw wpm,
          accuracy, character stats, test length, leaderboards info and test
          info (you can hover over some values to get floating point numbers).
          You can also see a graph of your wpm and raw over the duration of the
          test. Remember that the wpm line is a global average, while the raw
          wpm line is a local, momentary value (meaning if you stop, the value
          is 0).
        </p>
      </div>
      <div class="section">
        <div class="title">
          <i class="fas fa-bug"></i>
          bug report or feature request
        </div>
        <p>
          If you encounter a bug, or have a feature request - join the Discord
          server, send me an email, a direct message on Twitter or create an
          issue on GitHub.
        </p>
      </div>
      <div></div>
      <div class="section">
        <div class="bigtitle">
          <i class="fas fa-life-ring"></i>
          support
        </div>
        <p>
          Thanks to everyone who has supported this project. It would not be
          possible without you and your continued support.
        </p>
        <div class="supportButtons">
          <Button
            icon="fas fa-donate"
            onClick={() => showModal("Support")}
            text="support"
          />
        </div>
      </div>
      <div></div>
      <div class="section">
        <div class="bigtitle">
          <i class="fas fa-envelope"></i>
          contact
        </div>
        <p>
          If you encounter a bug, have a feature request or just want to say hi
          - here are the different ways you can contact me directly.
        </p>
        <div class="contactButtons">
          <Button
            text="mail"
            icon="fas fa-envelope"
            onClick={() => showModal("Contact")}
          />
          <Button
            text="twitter"
            icon="fab fa-twitter"
            href="https://x.com/monkeytype"
          />
          <Button
            text="discord"
            icon="fab fa-discord"
            href="https://discord.gg/monkeytype"
          />
          <Button
            text="github"
            icon="fab fa-github"
            href="https://github.com/monkeytypegame/monkeytype"
          />
        </div>
      </div>
      <div></div>
      <div class="section" data-section="credits">
        <div class="bigtitle">
          <i class="fas fa-users"></i>
          credits
        </div>
        <p>
          <Button
            type="text"
            text="Montydrei"
            href="https://www.reddit.com/user/montydrei"
          />
          for the name suggestion
        </p>
        <p>
          <Button
            type="text"
            text="Everyone"
            href="https://www.reddit.com/r/MechanicalKeyboards/comments/gc6wx3/experimenting_with_a_completely_new_type_of/"
          />
          who provided valuable feedback on the original reddit post for the
          prototype of this website
        </p>
        <p>
          <Button type="text" text="Supporters" href="#supporters_title" />
          who helped financially by donating, enabling optional ads or buying
          merch
        </p>
        <p>
          <Button
            type="text"
            text="Contributors"
            href="https://github.com/monkeytypegame/monkeytype/graphs/contributors"
          />
          on GitHub that have helped with implementing various features, adding
          themes and more
        </p>
      </div>
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
      <div class="section" data-section="supporters">
        <div id="supporters_title" class="bigtitle">
          <i class="fas fa-hand-holding-usd"></i>
          top supporters
        </div>
        <AsyncContent
          resource={supporters}
          errorMessage="Failed to get supporters"
        >
          {(data) => (
            <div class="supporters">
              <For each={data}>{(name) => <div>{name}</div>}</For>
            </div>
          )}
        </AsyncContent>
      </div>
      <div></div>
      <div class="section" data-section="contributors">
        <div id="contributors_title" class="bigtitle">
          <i class="fas fa-code-branch"></i>
          contributors
        </div>
        <AsyncContent
          resource={contributors}
          errorMessage="Failed to get contributors"
        >
          {(data) => (
            <div class="contributors">
              <For each={data}>{(name) => <div>{name}</div>}</For>
            </div>
          )}
        </AsyncContent>
      </div>
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
