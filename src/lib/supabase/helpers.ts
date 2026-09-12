export type UntypedClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

export function asUntyped(client: unknown): UntypedClient {
  return client as UntypedClient;
}
