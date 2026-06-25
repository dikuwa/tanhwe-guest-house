import "server-only";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const MAX_ROOM_IMAGE_SIZE = 5 * 1024 * 1024;
export const ROOM_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type R2Config = {
  bucket: string;
  publicUrl: URL;
};

let client: S3Client | undefined;
let config: R2Config | undefined;

function getR2Config(): R2Config {
  if (config) return config;

  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicUrl) throw new Error("R2_BUCKET_NAME and R2_PUBLIC_URL are required");

  config = { bucket, publicUrl: new URL(publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`) };
  return config;
}

function getR2Client(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 credentials are not configured");
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function extensionForImageType(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  throw new Error("Unsupported image type");
}

function extensionFor(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  throw new Error("Unsupported image type");
}

function hasValidSignature(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.slice(0, signature.length).every((byte, index) => byte === signature[index]);
  }
  if (type === "image/webp") {
    const decoder = new TextDecoder();
    return (
      decoder.decode(bytes.slice(0, 4)) === "RIFF" && decoder.decode(bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

function roomPath(roomId: string): string {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(roomId)) throw new Error("Invalid room ID");
  return roomId;
}

function publicObjectUrl(key: string): string {
  const { publicUrl } = getR2Config();
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return new URL(encodedKey, publicUrl).toString();
}

function keyFromPublicUrl(imageUrl: string): string {
  const candidate = new URL(imageUrl);
  const { publicUrl } = getR2Config();
  const legacyValue = process.env.R2_LEGACY_PUBLIC_URL;
  const bases = [
    publicUrl,
    ...(legacyValue ? [new URL(legacyValue.endsWith("/") ? legacyValue : `${legacyValue}/`)] : []),
  ];
  const base = bases.find(
    (value) => candidate.origin === value.origin && candidate.pathname.startsWith(value.pathname)
  );
  if (!base) {
    throw new Error("Invalid R2 image URL");
  }

  const key = decodeURIComponent(candidate.pathname.slice(base.pathname.length));
  if (!key || key.includes("..")) throw new Error("Invalid R2 object key");
  return key;
}

export async function uploadGenericImage(file: File, path: string): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
    throw new Error("Unsupported image type");
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be between 1 byte and 5 MB");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type))
    throw new Error("File contents do not match its image type");

  // Sanitize path: only allow alphanumeric and hyphens
  const sanitized = path.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!sanitized || sanitized.length > 64) throw new Error("Invalid path");

  const key = `${sanitized}/${crypto.randomUUID()}.${extensionForImageType(file.type)}`;
  const { bucket } = getR2Config();
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return publicObjectUrl(key);
}

export async function deleteGenericImage(imageUrl: string): Promise<void> {
  const { bucket } = getR2Config();
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: keyFromPublicUrl(imageUrl),
    })
  );
}

export async function uploadRoomImage(file: File, roomId: string): Promise<string> {
  if (!ROOM_IMAGE_TYPES.includes(file.type as (typeof ROOM_IMAGE_TYPES)[number])) {
    throw new Error("Unsupported image type");
  }
  if (file.size <= 0 || file.size > MAX_ROOM_IMAGE_SIZE) {
    throw new Error("Image must be between 1 byte and 5 MB");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type))
    throw new Error("File contents do not match its image type");

  const key = `${roomPath(roomId)}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const { bucket } = getR2Config();
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return publicObjectUrl(key);
}

export async function deleteRoomImage(imageUrl: string): Promise<void> {
  const { bucket } = getR2Config();
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: keyFromPublicUrl(imageUrl),
    })
  );
}

export async function listRoomImages(roomId: string): Promise<string[]> {
  const prefix = `${roomPath(roomId)}/`;
  const { bucket } = getR2Config();
  const response = await getR2Client().send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 100,
    })
  );

  return (response.Contents ?? [])
    .flatMap((object) => (object.Key ? [object.Key] : []))
    .map(publicObjectUrl);
}
