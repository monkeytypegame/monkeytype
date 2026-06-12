import { Button } from "../common/Button";
import { H2 } from "../common/Headers";
import { Page } from "../common/Page";

export function NotFoundPage() {
  return (
    <Page id="404">
      <div class="flex h-full items-center justify-center">
        <div class="flex flex-col gap-8 md:flex-row">
          <div class="place-self-center">
            <img src="/images/monkeymeme.jpg" class="rounded-xl" />
          </div>
          <div class="flex max-w-md flex-col items-center gap-4">
            <H2 text="404" class="pb-0 text-7xl text-main" />
            <p class="text-center">
              Ooops! Looks like this page
              <br />
              or resource doesn&apos;t exist.
            </p>
            <Button
              fa={{ icon: "fa-home" }}
              text="Go Home"
              router-link
              href="/"
              class="px-8 py-4"
            />
          </div>
        </div>
      </div>
    </Page>
  );
}
