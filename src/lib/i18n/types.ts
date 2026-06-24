import { type messagesTr } from "./messages.tr";

type DeepString<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: DeepString<T[K]> }
    : never;

export type Messages = DeepString<typeof messagesTr>;
