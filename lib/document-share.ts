import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be configured");
  return value;
}

function signature(documentId: string, expires: number) {
  return createHmac("sha256", getSecret()).update(`${documentId}:${expires}`).digest("base64url");
}

export function createDocumentShareToken(documentId: string, lifetimeSeconds = 60 * 60 * 24 * 7) {
  const expires = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  return `${expires}.${signature(documentId, expires)}`;
}

export function verifyDocumentShareToken(documentId: string, token: string | null) {
  if (!token) return false;
  const [expiresValue, suppliedSignature] = token.split(".");
  const expires = Number(expiresValue);
  if (!Number.isSafeInteger(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(signature(documentId, expires));
  const supplied = Buffer.from(suppliedSignature ?? "");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
