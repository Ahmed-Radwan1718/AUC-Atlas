import type { NextApiRequest, NextApiResponse } from "next";

export type BackendRequest = NextApiRequest;
export type BackendResponse = NextApiResponse;

export type BackendError = Error & {
  statusCode?: number;
  retryAfterSeconds?: number;
  code?: string;
  revokedReason?: string;
  firebaseError?: unknown;
  firebaseErrorCode?: string;
  sessionCookieTimeout?: boolean;
  requiresTwoFactor?: boolean;
};

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

export function asBackendError(error: unknown, fallback = "Unexpected server error."): BackendError {
  return error instanceof Error ? (error as BackendError) : (new Error(fallback) as BackendError);
}
