import "server-only";

export type ErrorWithStatus = Error & {
  statusCode?: number;
  retryAfterSeconds?: number;
  code?: string;
};

export class ApiError extends Error {
  statusCode: number;
  retryAfterSeconds?: number;
  code?: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export function cleanString(value: unknown, maxLength: number): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function getTimestampMillis(value: unknown): number {
  if (!value) return 0;

  const timestamp = value as {
    toMillis?: () => number;
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }

  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().getTime();
  }

  if (typeof timestamp.seconds === "number") {
    return timestamp.seconds * 1000;
  }

  if (typeof timestamp._seconds === "number") {
    return timestamp._seconds * 1000;
  }

  const parsedDate = new Date(String(value));
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

export function getRequestIp(request: Request): string {
  const forwardedFor = String(request.headers.get("x-forwarded-for") || "")
    .split(",")[0]
    .trim();
  const realIp = String(request.headers.get("x-real-ip") || "").trim();

  return cleanString(forwardedFor || realIp || "unknown", 100).toLowerCase();
}

export function getCookie(request: Request, name: string): string {
  const cookieHeader = request.headers.get("cookie") || "";

  for (const cookie of cookieHeader.split(";")) {
    const parts = cookie.trim().split("=");
    if (parts[0] === name) {
      try {
        return decodeURIComponent(parts.slice(1).join("="));
      } catch {
        return parts.slice(1).join("=");
      }
    }
  }

  return "";
}

export function getErrorStatus(error: unknown, fallback = 500): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    const statusCode = Number((error as ErrorWithStatus).statusCode);
    if (Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599) {
      return statusCode;
    }
  }

  return fallback;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function getRetryAfterSeconds(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("retryAfterSeconds" in error)) {
    return undefined;
  }

  const retryAfter = Number((error as ErrorWithStatus).retryAfterSeconds);
  return Number.isFinite(retryAfter) && retryAfter > 0
    ? Math.ceil(retryAfter)
    : undefined;
}
