import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import type { BackendError, UnknownRecord } from "@/server/backend/types";

const ENCRYPTION_VERSION = 1;
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_IV_BYTES = 12;
const ENCRYPTION_TAG_BYTES = 16;

export type EncryptedTotpSecret = {
  version: number;
  algorithm: string;
  iv: string;
  ciphertext: string;
  authenticationTag: string;
};

function createTotpEncryptionError(message?: string): BackendError {
  const error = new Error(message || "Authenticator encryption failed.") as BackendError;
  error.statusCode = 500;
  error.code = "totp-encryption-error";
  return error;
}

function getTotpEncryptionKey(): Buffer {
  const configuredKey = String(process.env.TOTP_ENCRYPTION_KEY || "").trim();
  let encryptionKey = Buffer.alloc(0);

  if (/^[a-f0-9]{64}$/i.test(configuredKey)) {
    encryptionKey = Buffer.from(configuredKey, "hex");
  } else if (configuredKey) {
    encryptionKey = Buffer.from(configuredKey, "base64");
  }

  if (encryptionKey.length !== 32) {
    throw createTotpEncryptionError("TOTP encryption is not configured correctly.");
  }

  return encryptionKey;
}

function getAuthenticatedContext(context: unknown): Buffer {
  const safeContext = String(context || "").trim();
  if (!safeContext) {
    throw createTotpEncryptionError("Authenticator encryption context is missing.");
  }
  return Buffer.from(`auc-atlas-totp:v1:${safeContext}`, "utf8");
}

export function encryptTotpSecret(secret: unknown, context: unknown): EncryptedTotpSecret {
  const cleanSecret = String(secret || "").trim();
  if (!cleanSecret) throw createTotpEncryptionError("Authenticator secret is missing.");

  const initializationVector = randomBytes(ENCRYPTION_IV_BYTES);
  const cipher = createCipheriv(
    ENCRYPTION_ALGORITHM,
    getTotpEncryptionKey(),
    initializationVector,
  );
  cipher.setAAD(getAuthenticatedContext(context));

  const ciphertext = Buffer.concat([
    cipher.update(cleanSecret, "utf8"),
    cipher.final(),
  ]);
  const authenticationTag = cipher.getAuthTag();

  return {
    version: ENCRYPTION_VERSION,
    algorithm: ENCRYPTION_ALGORITHM,
    iv: initializationVector.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authenticationTag: authenticationTag.toString("base64"),
  };
}

export function decryptTotpSecret(encryptedSecret: unknown, context: unknown): string {
  const data = (encryptedSecret && typeof encryptedSecret === "object"
    ? encryptedSecret
    : {}) as UnknownRecord;

  if (
    data.version !== ENCRYPTION_VERSION ||
    data.algorithm !== ENCRYPTION_ALGORITHM ||
    typeof data.iv !== "string" ||
    typeof data.ciphertext !== "string" ||
    typeof data.authenticationTag !== "string"
  ) {
    throw createTotpEncryptionError("Stored authenticator secret is invalid.");
  }

  try {
    const initializationVector = Buffer.from(data.iv, "base64");
    const ciphertext = Buffer.from(data.ciphertext, "base64");
    const authenticationTag = Buffer.from(data.authenticationTag, "base64");

    if (
      initializationVector.length !== ENCRYPTION_IV_BYTES ||
      authenticationTag.length !== ENCRYPTION_TAG_BYTES ||
      !ciphertext.length
    ) {
      throw new Error("invalid-encrypted-secret");
    }

    const decipher = createDecipheriv(
      ENCRYPTION_ALGORITHM,
      getTotpEncryptionKey(),
      initializationVector,
    );
    decipher.setAAD(getAuthenticatedContext(context));
    decipher.setAuthTag(authenticationTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8").trim();

    if (!plaintext) throw new Error("empty-decrypted-secret");
    return plaintext;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "totp-encryption-error"
    ) {
      throw error;
    }
    throw createTotpEncryptionError("Stored authenticator secret could not be decrypted.");
  }
}
