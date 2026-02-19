import { createSignal, JSXElement } from "solid-js";

import { getFocus, getIsScreenshotting } from "../../../signals/core";
import { showModal } from "../../../stores/modals";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import SlimSelect from "../../ui/SlimSelect";

import { Keytips } from "./Keytips";
import { ThemeIndicator } from "./ThemeIndicator";
import { VersionButton } from "./VersionButton";

export function Footer(): JSXElement {
  // const [state, setState] = createSignal(["initial"]);
  const [testData, setTestData] = createSignal([
    { value: "test1", text: "test1", selected: true },
    { value: "test2", text: "test2", selected: true },
    { value: "test3", text: "test3", selected: false },
  ]);

  const toggleTest1 = (): void => {
    console.log("[Footer] toggleTest1 called");
    const current = testData();
    console.log("[Footer] current data:", JSON.stringify(current, null, 2));
    const item0 = current[0];
    const item1 = current[1];
    const item2 = current[2];
    if (!item0 || !item1 || !item2) return;
    const newData = [
      { value: "test1", text: "test1", selected: !item0.selected },
      item1,
      item2,
    ];
    console.log("[Footer] setting new data:", JSON.stringify(newData, null, 2));
    setTestData(newData);
  };

  const toggleTest2 = (): void => {
    console.log("[Footer] toggleTest2 called");
    const current = testData();
    console.log("[Footer] current data:", JSON.stringify(current, null, 2));
    const item0 = current[0];
    const item1 = current[1];
    const item2 = current[2];
    if (!item0 || !item1 || !item2) return;
    const newData = [
      item0,
      { value: "test2", text: "test2", selected: !item1.selected },
      item2,
    ];
    console.log("[Footer] setting new data:", JSON.stringify(newData, null, 2));
    setTestData(newData);
  };

  const toggleTest3 = (): void => {
    console.log("[Footer] toggleTest3 called");
    const current = testData();
    console.log("[Footer] current data:", JSON.stringify(current, null, 2));
    const item0 = current[0];
    const item1 = current[1];
    const item2 = current[2];
    if (!item0 || !item1 || !item2) return;
    const newData = [
      item0,
      item1,
      { value: "test3", text: "test3", selected: !item2.selected },
    ];
    console.log("[Footer] setting new data:", JSON.stringify(newData, null, 2));
    setTestData(newData);
  };

  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      {testData()
        .filter((item) => item.selected)
        .map((item) => item.value)
        .join(" - ")}
      <div class="mb-2 flex gap-4">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            checked={testData()[0]?.selected ?? false}
            onChange={toggleTest1}
          />
          test1 selected
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            checked={testData()[1]?.selected ?? false}
            onChange={toggleTest2}
          />
          test2 selected
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            checked={testData()[2]?.selected ?? false}
            onChange={toggleTest3}
          />
          test3 selected
        </label>
      </div>
      <SlimSelect
        settings={{
          showSearch: false,
          allowDeselect: true,
          closeOnSelect: false,
        }}
        data={testData()}
        dataSetter={setTestData}
        multiple
        addAllOption
      ></SlimSelect>
      <Keytips />

      <div
        class="-m-2 flex justify-between gap-8 transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <div class="grid grid-cols-1 justify-items-start xs:grid-cols-2 sm:grid-cols-4 lg:flex">
          <Button
            type="text"
            text="contact"
            fa={{
              icon: "fa-envelope",
              fixedWidth: true,
            }}
            onClick={() => showModal("Contact")}
          />
          <Button
            type="text"
            text="support"
            fa={{
              icon: "fa-donate",
              fixedWidth: true,
            }}
            onClick={() => showModal("Support")}
          />
          <Button
            type="text"
            text="github"
            fa={{
              icon: "fa-code",
              fixedWidth: true,
            }}
            href="https://github.com/monkeytypegame/monkeytype"
          />
          <Button
            type="text"
            text="discord"
            fa={{
              icon: "fa-discord",
              variant: "brand",
              fixedWidth: true,
            }}
            href="https://www.discord.gg/monkeytype"
          />
          <Button
            type="text"
            text="twitter"
            fa={{
              icon: "fa-twitter",
              variant: "brand",
              fixedWidth: true,
            }}
            href="https://x.com/monkeytype"
          />
          <Button
            type="text"
            text="terms"
            fa={{
              icon: "fa-file-contract",
              fixedWidth: true,
            }}
            href="/terms-of-service.html"
          />
          <Button
            href="/security-policy.html"
            type="text"
            text="security"
            fa={{
              icon: "fa-shield-alt",
              fixedWidth: true,
            }}
          />
          <Button
            href="/privacy-policy.html"
            type="text"
            text="privacy"
            fa={{
              icon: "fa-lock",
              fixedWidth: true,
            }}
          />
        </div>
        <div class="flex flex-col items-end text-right lg:flex-row">
          <ThemeIndicator />
          <VersionButton />
        </div>
      </div>
    </footer>
  );
}
