import { getMessages } from "./index";
import { getServerLocale } from "./server-locale";
import type { Messages } from "./types";

export { getServerLocale } from "./server-locale";
export type { Messages } from "./types";

export async function getServerMessages(): Promise<Messages> {
  return getMessages(await getServerLocale());
}
