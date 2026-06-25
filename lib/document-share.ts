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

/**
 * Create a self-contained share URL token that encodes the document ID,
 * expiry, and HMAC signature. Used in customer-facing download links.
 *
 * Format: base64url("documentId:expires.signature")
 */
export function createDocumentShareUrl(documentId: string, lifetimeSeconds = 60 * 60 * 24 * 7) {
  const expires = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  const sig = signature(documentId, expires);
  return Buffer.from(`${documentId}:${expires}.${sig}`).toString("base64url");
}

/**
 * Parse and verify a self-contained share URL token.
 * Returns the document ID on success, or null on failure/expiry.
 */
export function verifyDocumentShareUrl(combined: string): string | null {
  try {
    const decoded = Buffer.from(combined, "base64url").toString();
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return null;
    const documentId = decoded.slice(0, colonIndex);
    const rest = decoded.slice(colonIndex + 1);
    const dotIndex = rest.indexOf(".");
    if (dotIndex === -1) return null;
    const expiresValue = rest.slice(0, dotIndex);
    const suppliedSignature = rest.slice(dotIndex + 1);
    const expires = Number(expiresValue);
    if (!Number.isSafeInteger(expires) || expires < Math.floor(Date.now() / 1000)) return null;
    const expected = Buffer.from(signature(documentId, expires));
    const supplied = Buffer.from(suppliedSignature ?? "");
    if (expected.length !== supplied.length) return null;
    if (!timingSafeEqual(expected, supplied)) return null;
    return documentId;
  } catch {
    return null;
  }
}
