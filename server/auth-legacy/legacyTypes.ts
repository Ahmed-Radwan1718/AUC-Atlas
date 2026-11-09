/** Request/response contract exposed by the Next.js compatibility bridge. */
export type LegacyRequest = {
  method: string;
  headers: Record<string, string>;
  query: Record<string, string | string[]>;
  // Individual legacy route bodies are validated at runtime, as before.
  body: any;
  socket: { remoteAddress: string };
};

export type LegacyReply = {
  status(value: number): LegacyReply;
  json(value: unknown): LegacyReply;
  send(value: unknown): LegacyReply;
  end(value?: unknown): LegacyReply;
  getHeader(name: string): string | string[] | undefined;
  setHeader(name: string, value: string | string[]): LegacyReply;
};

// The original handlers attach HTTP metadata to Error instances.
// Declaring these properties preserves their existing runtime behavior.
declare global {
  interface Error {
    statusCode?: number;
    retryAfterSeconds?: number;
    firebaseErrorCode?: string;
    code?: string;
  }
}
