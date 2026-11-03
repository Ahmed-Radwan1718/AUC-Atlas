import type {
  AccountResponse,
  AuthenticatorResponse,
  MaterialsResponse,
  ProfilePhotoSignature,
  ReviewsResponse,
  SessionsResponse,
} from "@/features/account/types";

export class AccountApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "") {
    super(message);
    this.name = "AccountApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  securityAccessToken?: string;
};

export async function accountRequest<T extends { error?: string; code?: string }>(
  path: string,
  options: RequestOptions = {},
) {
  const method = options.method || "GET";
  const headers: Record<string, string> = { Accept: "application/json" };

  if (method !== "GET") headers["Content-Type"] = "application/json";
  if (options.securityAccessToken) {
    headers["X-AUC-Security-Access"] = options.securityAccessToken;
  }

  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: method === "GET" ? undefined : JSON.stringify(options.body || {}),
  });
  const data = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    throw new AccountApiError(
      data.error || "The request could not be completed.",
      response.status,
      data.code || "",
    );
  }

  return data;
}

export function loadAccount() {
  return accountRequest<AccountResponse>("/api/me");
}

export function saveAccount(fullName: string, major: string) {
  return accountRequest<AccountResponse>("/api/me", {
    method: "PATCH",
    body: { fullName, major },
  });
}

export function profilePhotoAction(
  body: Record<string, unknown>,
) {
  return accountRequest<ProfilePhotoSignature & AccountResponse>("/api/profile-photo", {
    method: "POST",
    body,
  });
}

export function loadSessions(securityAccessToken: string) {
  return accountRequest<SessionsResponse>("/api/sessions", { securityAccessToken });
}

export function revokeSession(sessionId: string, securityAccessToken: string) {
  return accountRequest<SessionsResponse>("/api/sessions", {
    method: "DELETE",
    body: { sessionId },
    securityAccessToken,
  });
}

export function authenticatorAction(
  action: string,
  body: Record<string, unknown> = {},
  securityAccessToken = "",
) {
  return accountRequest<AuthenticatorResponse>("/api/authenticator", {
    method: "POST",
    body: { action, ...body },
    securityAccessToken,
  });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  securityAccessToken: string,
) {
  return accountRequest<{ success?: boolean; error?: string }>("/api/change-password", {
    method: "POST",
    body: { currentPassword, newPassword, confirmPassword },
    securityAccessToken,
  });
}

export function deleteAccount(
  currentPassword: string,
  confirmation: string,
  securityAccessToken: string,
) {
  return accountRequest<{ success?: boolean; error?: string }>("/api/delete-account", {
    method: "DELETE",
    body: { currentPassword, confirmation },
    securityAccessToken,
  });
}

export function loadReviews() {
  return accountRequest<ReviewsResponse>("/api/professor-reviews?mine=true");
}

export function updateReview(body: Record<string, unknown>) {
  return accountRequest<ReviewsResponse>("/api/professor-reviews", {
    method: "PATCH",
    body,
  });
}

export function deleteReview(reviewId: string) {
  return accountRequest<ReviewsResponse>("/api/professor-reviews", {
    method: "DELETE",
    body: { reviewId },
  });
}

export function loadMaterials() {
  return accountRequest<MaterialsResponse>("/api/course-materials?mine=true");
}

export function updateMaterial(materialId: string, title: string, materialType: string) {
  return accountRequest<MaterialsResponse>("/api/course-materials", {
    method: "PATCH",
    body: { materialId, title, materialType },
  });
}

export function deleteMaterial(materialId: string) {
  return accountRequest<MaterialsResponse>("/api/course-materials", {
    method: "DELETE",
    body: { materialId },
  });
}

export async function logoutAccount() {
  await accountRequest<{ success?: boolean; error?: string }>("/api/logout", {
    method: "POST",
  }).catch(() => undefined);
}
