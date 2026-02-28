import { createSignal, For, JSXElement } from "solid-js";

import { Button } from "../Button";
import { AnimeGroup } from "./AnimeGroup";

let nextId = 1;

export function AnimeGroupTest(): JSXElement {
  const [items, setItems] = createSignal<{ id: number; label: string }[]>([
    { id: nextId++, label: "Item 1" },
    { id: nextId++, label: "Item 2" },
    { id: nextId++, label: "Item 3" },
  ]);

  const addItem = (): void => {
    const id = nextId++;
    setItems((prev) => [...prev, { id, label: `Item ${id}` }]);
  };

  const removeItem = (): void => {
    setItems((prev) => prev.slice(0, -1));
  };

  return (
    <section>
      <div class="mb-4 flex gap-2">
        <Button text="Add item" fa={{ icon: "fa-plus" }} onClick={addItem} />
        <Button
          text="Remove last"
          fa={{ icon: "fa-minus" }}
          onClick={removeItem}
          disabled={items().length === 0}
        />
      </div>
      <AnimeGroup
        animation={{
          opacity: [0, 1],
          translateX: [-20, 0],
          easing: "easeOutCubic",
        }}
        initial={{ opacity: 0, translateX: -20 }}
        exit={{
          opacity: 0,
          translateX: 20,
          duration: 125,
          easing: "easeInCubic",
        }}
        stagger={60}
        class="flex flex-col gap-2"
      >
        <For each={items()}>
          {(item) => (
            <div class="rounded bg-sub-alt p-3 text-text" data-id={item.id}>
              {item.label}
            </div>
          )}
        </For>
      </AnimeGroup>
    </section>
  );
}
