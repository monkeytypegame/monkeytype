import { useQuery } from "@tanstack/solid-query";
import { For, JSXElement, Show } from "solid-js";

import { queryClient } from "../../queries";
import {
  getContributorsQueryOptions,
  getSpeedHistogramQueryOptions,
  getSupportersQueryOptions,
  getTypingStatsQueryOptions,
} from "../../queries/public";
import { getConfig } from "../../signals/config";
import { getActivePage } from "../../signals/core";
import { showModal } from "../../stores/modals";
import { qsr } from "../../utils/dom";
import AsyncContent from "../common/AsyncContent";
import { Button } from "../common/Button";
import { ChartJs } from "../common/ChartJs";
import { Fa, FaProps } from "../common/Fa";

function H2(props: { text: string; fa: FaProps }): JSXElement {
  return (
    <h2 class="flex place-items-center gap-4 pb-4 text-4xl text-sub">
      <Fa {...props.fa} />
      {props.text}
    </h2>
  );
}

function H3(props: { text: string; fa: FaProps }): JSXElement {
  return (
    <h3 class="flex place-items-center gap-2 pb-2 text-sub">
      <Fa {...props.fa} />
      {props.text}
    </h3>
  );
}

qsr("nav .view-about").on("mouseenter", () => {
  prefetch();
});

export function AboutPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "about";

  const contributors = useQuery(() => ({
    ...getContributorsQueryOptions(),
    enabled: isOpen(),
  }));

  const supporters = useQuery(() => ({
    ...getSupportersQueryOptions(),
    enabled: isOpen(),
  }));

  const typingStats = useQuery(() => ({
    ...getTypingStatsQueryOptions(),
    enabled: isOpen(),
  }));

  const speedHistogram = useQuery(() => ({
    ...getSpeedHistogramQueryOptions(),
    enabled: isOpen(),
  }));

  return (
    <div class="content-grid grid gap-8">
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
          query={typingStats}
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
          query={speedHistogram}
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
        <H2 fa={{ icon: "fa-info-circle" }} text="about" />
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
        <H3 fa={{ icon: "fa-align-left" }} text="word set" />
        <p>
          By default, this website uses the most common 200 words in the English
          language to generate its tests. You can change to an expanded set
          (1000 most common words) in the options, or change the language
          entirely.
        </p>
      </section>
      <section>
        <H3 fa={{ icon: "fa-keyboard" }} text="keybinds" />
        <p>
          You can use <kbd>tab</kbd> and <kbd>enter</kbd> (or just{" "}
          <kbd>tab</kbd> if you have quick tab mode enabled) to restart the
          typing test. Open the command line by pressing <kbd>ctrl/cmd</kbd> +{" "}
          <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd> - there you can
          access all the functionality you need without touching your mouse.
        </p>
      </section>
      <section>
        <H3 fa={{ icon: "fa-list-ol" }} text="stats" />
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
      <Show when={getConfig.ads === "sellout"}>
        <div
          id="ad-about-1-wrapper"
          class="ad full-width advertisement ad-h place-self-center"
        >
          <div class="icon">
            <Fa icon="fa-ad" />
          </div>
          <div id="ad-about-1"></div>
        </div>
        <div
          id="ad-about-1-small-wrapper"
          class="ad advertisement ad-h-s place-self-center"
        >
          <div class="icon small">
            <Fa icon="fa-ad" />
          </div>
          <div id="ad-about-1-small"></div>
        </div>
      </Show>
      <section>
        <H3 fa={{ icon: "fa-chart-area" }} text="results screen" />
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
        <H3 fa={{ icon: "fa-bug" }} text="bug report or feature request" />
        <p>
          If you encounter a bug, or have a feature request - join the Discord
          server, send me an email, a direct message on Twitter or create an
          issue on GitHub.
        </p>
      </section>
      <div></div>
      <section>
        <H2 fa={{ icon: "fa-life-ring" }} text="support" />
        <p>
          Thanks to everyone who has supported this project. It would not be
          possible without you and your continued support.
        </p>
        <div class="mt-4 text-xl">
          <Button
            fa={{
              icon: "fa-donate",
            }}
            onClick={() => showModal("Support")}
            text="support"
            class="w-full p-8"
          />
        </div>
      </section>
      <div></div>
      <section>
        <H2 fa={{ icon: "fa-envelope" }} text="contact" />
        <p>
          If you encounter a bug, have a feature request or just want to say hi
          - here are the different ways you can contact me directly.
        </p>
        <div class="mt-4 grid w-full grid-cols-1 gap-4 text-xl sm:grid-cols-2 lg:grid-cols-4">
          <Button
            text="mail"
            fa={{ icon: "fa-envelope" }}
            onClick={() => showModal("Contact")}
            class="w-full p-8"
          />
          <Button
            text="twitter"
            fa={{ icon: "fa-twitter", variant: "brand" }}
            href="https://x.com/monkeytype"
            class="w-full p-8"
          />
          <Button
            text="discord"
            fa={{ icon: "fa-discord", variant: "brand" }}
            href="https://discord.gg/monkeytype"
            class="w-full p-8"
          />
          <Button
            text="github"
            fa={{ icon: "fa-github", variant: "brand" }}
            href="https://github.com/monkeytypegame/monkeytype"
            class="w-full p-8"
          />
        </div>
      </section>
      <div></div>
      <section>
        <H2 fa={{ icon: "fa-users" }} text="credits" />
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
      <Show when={getConfig.ads === "sellout"}>
        <div
          id="ad-about-2-wrapper"
          class="ad full-width advertisement ad-h place-self-center"
        >
          <div class="icon">
            <Fa icon="fa-ad" />
          </div>
          <div id="ad-about-2"></div>
        </div>
        <div
          id="ad-about-2-small-wrapper"
          class="ad advertisement ad-h-s place-self-center"
        >
          <div class="icon small">
            <Fa icon="fa-ad" />
          </div>
          <div id="ad-about-2-small"></div>
        </div>
      </Show>
      <div></div>
      <section>
        <H2 fa={{ icon: "fa-hand-holding-usd" }} text="top supporters" />
        <AsyncContent
          query={supporters}
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
        <H2 fa={{ icon: "fa-code-branch" }} text="contributors" />
        <AsyncContent
          query={contributors}
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
    </div>
  );
}

function prefetch(): void {
  void queryClient.prefetchQuery(getContributorsQueryOptions());
  void queryClient.prefetchQuery(getSupportersQueryOptions());
  void queryClient.prefetchQuery(getTypingStatsQueryOptions());
  void queryClient.prefetchQuery(getSpeedHistogramQueryOptions());
}
