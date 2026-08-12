import { cache } from "react";

import { getMessages } from "./index";
import { getServerLocale } from "./server-locale";
import type { Messages } from "./types";

export { getServerLocale } from "./server-locale";
export type { Messages } from "./types";

export const getServerMessages = cache(async (): Promise<Messages> => {
  return getMessages(await getServerLocale());
});
