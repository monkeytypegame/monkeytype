import { useQuery } from "@tanstack/solid-query";
import { createSignal, For, JSXElement, Show } from "solid-js";

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
import { AnimatedShow, Anime, AnimePresence } from "../common/anime";
import { AnimeGroupTest } from "../common/anime/AnimeGroupTest";
import AsyncContent from "../common/AsyncContent";
import { Button } from "../common/Button";
import { ChartJs } from "../common/ChartJs";
import { Fa } from "../common/Fa";
import { H2, H3 } from "../common/Headers";

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

  const [visible, setVisible] = createSignal(false);

  return (
    <div class="content-grid grid gap-8">
      <button onClick={() => setVisible(!visible())} type="button">
        Toggle visibility
      </button>
      <Show when={visible()}>
        <AnimeGroupTest />
      </Show>
      <AnimePresence exitBeforeEnter>
        <Show when={visible()}>
          <Anime
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, duration: 300 }}
            exit={{ opacity: 0, duration: 300 }}
          >
            <div>Content with exit animation</div>
          </Anime>
        </Show>
        <Show when={!visible()}>
          <Anime
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, duration: 300 }}
            exit={{ opacity: 0, duration: 300 }}
          >
            <div>ayoop</div>
          </Anime>
        </Show>
      </AnimePresence>
      <div>
        <AnimatedShow slide when={visible()}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum eius
          dolorum, vitae, consequatur, ipsum voluptatum voluptatibus pariatur
          illo dignissimos omnis atque reiciendis blanditiis perferendis numquam
          debitis eligendi repellat iusto repellendus voluptatem eos soluta nemo
          provident beatae quia? Veniam labore reprehenderit veritatis illo,
          error consequuntur dolores alias commodi dignissimos sint ex itaque
          odit, ipsa recusandae illum unde magni tempore quas eaque nisi dolor.
          Vero numquam saepe aut ab ipsam officiis error. Quibusdam quasi quia
          architecto reprehenderit harum corporis, atque, quidem aliquid quod
          velit iste. Sequi atque commodi laudantium vero velit quaerat eius
          rerum tempore culpa porro praesentium tempora nostrum eaque facere sed
          dolores quia assumenda, fugiat ad molestias nesciunt maxime soluta.
          Necessitatibus ratione hic sequi iure nisi in, cumque quas, inventore
          sapiente velit at corrupti est sint reprehenderit ipsam eius cum nihil
          molestiae? Repellendus eius corporis, officia expedita maiores
          voluptatem cupiditate fugit ducimus quae eaque? Eum sed ullam fuga
          eaque, non aliquid tempore dolores atque obcaecati temporibus animi
          veritatis veniam facilis minima, aspernatur neque molestias
          consectetur sint fugiat consequuntur quae similique eius? Ipsum velit
          illo unde dolor, reprehenderit dolorem esse incidunt porro odio
          dolorum numquam deleniti aperiam ad eius neque ratione repellat nisi,
          itaque voluptates. Alias consequuntur facilis maxime amet sunt error
          reprehenderit illum possimus dolore officiis odio enim saepe, dicta
          quas deserunt minima fugiat quaerat. Ipsam alias harum neque a
          eligendi laborum explicabo. Fuga architecto labore, unde nam eligendi
          aspernatur eius minima blanditiis eos id soluta, voluptatem iure qui
          assumenda exercitationem! Ex laborum, sint quia porro praesentium
          ratione earum, et adipisci quod quo, maxime laudantium pariatur!
          Itaque eos debitis rem aperiam cum, quidem molestias optio nam quae
          cumque voluptates magnam omnis cupiditate reiciendis quibusdam sed eum
          ea vel quisquam ducimus, perspiciatis in, rerum reprehenderit. Natus
          mollitia laborum similique libero, sapiente necessitatibus dolores
          iusto tempore sit fugiat. Odit praesentium eveniet quos eius voluptas
          maxime hic nobis numquam ipsum impedit expedita repellat corporis
          facere pariatur, incidunt inventore minima non tempore quis rerum
          tempora placeat laudantium aliquid! Ullam dignissimos facilis
          provident. Sint, assumenda ipsam quae porro possimus ullam ducimus
          rerum asperiores maxime debitis nihil eaque voluptatum blanditiis est
          dicta reprehenderit accusamus aspernatur nostrum voluptas doloremque
          veniam recusandae quibusdam! Animi asperiores voluptate, quaerat
          sapiente ea et provident atque doloremque tempora ducimus commodi,
          quis molestiae nostrum quasi numquam! Cumque molestiae fuga harum
          nobis! Vel, laboriosam deserunt alias incidunt officiis illo ullam
          ipsam rerum, consequuntur cum asperiores id soluta iure voluptate ex
          eligendi et. Eius provident illo ut accusamus facere reiciendis et
          perspiciatis sit iusto quis omnis, possimus recusandae. Placeat,
          perspiciatis quaerat consequuntur consequatur sint aliquid cupiditate
          recusandae, et error quibusdam magnam fugit neque modi tenetur dolore,
          ex aliquam provident. Quaerat, possimus impedit nemo consectetur id
          iure amet necessitatibus debitis saepe aperiam sint eaque numquam
          atque facilis iusto, minima placeat, dolore ipsam quibusdam fugiat
          molestias repellat nobis! Accusantium animi accusamus tenetur alias
          autem illum esse rerum possimus voluptatem natus. Quos necessitatibus
          dicta odit qui facilis placeat quaerat, blanditiis atque minus minima
          sint modi asperiores! Praesentium deserunt consequatur fugiat tempora
          ipsam perferendis veritatis sapiente iusto aut architecto?
        </AnimatedShow>
      </div>

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
        <H2
          id="supporters_title"
          fa={{ icon: "fa-hand-holding-usd" }}
          text="top supporters"
        />
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
        <H2
          id="contributors_title"
          fa={{ icon: "fa-code-branch" }}
          text="contributors"
        />
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
