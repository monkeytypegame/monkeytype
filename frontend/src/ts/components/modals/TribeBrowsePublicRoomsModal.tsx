import { createSignal, For, JSXElement, Show } from "solid-js";

import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal } from "../../states/modals";
import * as Tribe from "../../tribe/tribe";
import * as TribeConfig from "../../tribe/tribe-config";
import TribeSocket from "../../tribe/tribe-socket";
import * as TribeTypes from "../../tribe/types";
import { AnimatedModal } from "../common/AnimatedModal";
import { Fa } from "../common/Fa";

const modalId = "TribeBrowsePublicRooms";

export function TribeBrowsePublicRoomsModal(): JSXElement {
  const [rooms, setRooms] = createSignal<TribeTypes.PublicRoomData[]>([]);

  const load = (): void => {
    showLoaderBar();
    void TribeSocket.out.room.getPublicRooms(0, "").then((r) => {
      hideLoaderBar();
      setRooms(r.rooms);
    });
  };

  return (
    <AnimatedModal
      id={modalId}
      title="Public rooms"
      modalClass="h-[80vh] max-w-[600px] grid-rows-[auto_1fr]"
      beforeShow={load}
      afterHide={() => {
        setRooms([]);
      }}
    >
      <Show
        when={rooms().length > 0}
        fallback={
          <div class="grid place-items-center text-text">
            No public rooms found
          </div>
        }
      >
        <div class="grid h-auto content-start gap-2 overflow-y-auto">
          <For each={rooms()}>
            {(room) => (
              <button
                type="button"
                class="grid grid-cols-[1fr_1fr_3fr_auto] gap-2 rounded p-4 text-left text-sub [grid-template-areas:'name_name_name_chevron''state_players_config_chevron'] hover:bg-sub-alt"
                onClick={() => {
                  Tribe.joinRoom(room.id, true);
                  hideModal(modalId);
                }}
              >
                <Field class="[grid-area:name]" title="name" big>
                  {room.name}
                </Field>
                <Field class="[grid-area:state]" title="state">
                  {room.state}
                </Field>
                <Field class="[grid-area:players]" title="players">
                  {room.size}
                </Field>
                <Field class="[grid-area:config]" title="config">
                  {TribeConfig.getConfigString(room.config)}
                </Field>
                <div class="flex items-center text-3xl [grid-area:chevron]">
                  <Fa icon="fa-chevron-right" />
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>
    </AnimatedModal>
  );
}

function Field(props: {
  class: string;
  title: string;
  big?: boolean;
  children: JSXElement;
}): JSXElement {
  return (
    <div class={props.class}>
      <div
        class={
          props.big === true ? "text-base opacity-50" : "text-xs opacity-50"
        }
      >
        {props.title}
      </div>
      <div class={props.big === true ? "text-2xl text-text" : "text-xs"}>
        {props.children}
      </div>
    </div>
  );
}
