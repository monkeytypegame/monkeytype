import { onKeyup } from "../handlers/keyup";
import { onKeydown } from "../handlers/keydown";

export async function onKeyUp(event: KeyboardEvent): Promise<void> {
  console.debug("wordsInput event keyup", {
    event,
    key: event.key,
    code: event.code,
  });

  await onKeyup(event);
}

export async function onKeyDown(event: KeyboardEvent): Promise<void> {
  console.debug("wordsInput event keydown", {
    event,
    key: event.key,
    code: event.code,
  });

  await onKeydown(event);
}
