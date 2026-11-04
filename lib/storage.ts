import { mkdir, readFile, writeFile, unlink, stat } from "fs/promises";
import path from "path";

/**
 * File storage adapter.
 * Local disk is suitable for development or a server with a persistent volume.
 * On Netlify/Vercel/serverless deployments, configure a private Supabase Storage bucket
 * and a separate public bucket for cover images. The service-role key stays server-side.
 */
const ROOT = path.resolve(process.env.PRIVATE_STORAGE_DIR || path.join(process.cwd(), "storage"));
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || "sense-private";
const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || "sense-media";

function useCloudStorage() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

/** True when uploads persist in a private cloud bucket (required on Netlify/Vercel). */
export function privateStorageIsConfigured() {
  return useCloudStorage();
}

/** Browser direct uploads also require the public anon/publishable key. */
export function directUploadsAreConfigured() {
  return useCloudStorage() && Boolean(SUPABASE_ANON_KEY);
}

function encodeObjectPath(rel: string) {
  return rel.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function safeRelative(rel: string) {
  const cleaned = rel.replace(/^\/+/, "").replace(/\.\.(\/|\\)/g, "");
  const abs = path.resolve(ROOT, cleaned);
  if (!abs.startsWith(ROOT + path.sep) && abs !== ROOT) throw new Error("Path escapes private storage");
  return abs;
}

async function uploadToSupabase(bucket: string, rel: string, data: Buffer, contentType: string) {
  if (!useCloudStorage()) throw new Error("Supabase Storage is not configured");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(rel)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "false",
      "cache-control": "3600",
    },
    body: new Uint8Array(data),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed (${response.status}): ${detail.slice(0, 300)}`);
  }
}

async function downloadFromSupabase(bucket: string, rel: string, isPublic = false) {
  if (!useCloudStorage()) throw new Error("Supabase Storage is not configured");
  const objectPath = encodeObjectPath(rel);
  const endpoint = isPublic
    ? `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`
    : `${SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${objectPath}`;
  const response = await fetch(endpoint, {
    headers: isPublic ? {} : {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase Storage download failed (${response.status})`);
  const data = Buffer.from(await response.arrayBuffer());
  return { data, size: Number(response.headers.get("content-length") || data.byteLength) };
}

export function privateRoot() {
  return ROOT;
}

export async function savePrivateFile(subdir: string, name: string, data: Buffer) {
  const ext = path.extname(name).toLowerCase().slice(0, 12);
  const base = path.basename(name, path.extname(name)).replace(/[^\w\u0600-\u06FF-]+/g, "_").slice(0, 60);
  const rel = path.posix.join(subdir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}${ext}`);
  if (useCloudStorage()) {
    await uploadToSupabase(PRIVATE_BUCKET, rel, data, contentTypeFor(rel));
    return rel;
  }
  const abs = safeRelative(rel);
  await mkdir(path.dirname(abs), { recursive: true, mode: 0o700 });
  await writeFile(abs, data, { mode: 0o600, flag: "wx" });
  return rel;
}

export async function savePublicFile(subdir: string, name: string, data: Buffer) {
  const ext = path.extname(name).toLowerCase().slice(0, 12) || ".jpg";
  const rel = path.posix.join(subdir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  if (useCloudStorage()) {
    await uploadToSupabase(PUBLIC_BUCKET, rel, data, contentTypeFor(rel));
    return rel;
  }
  const dir = path.join(ROOT, "public", subdir);
  await mkdir(dir, { recursive: true, mode: 0o755 });
  await writeFile(path.join(dir, path.basename(rel)), data);
  return rel;
}

export async function readPublicFile(rel: string) {
  const cleaned = rel.replace(/^\/+/, "").replace(/\.\.(\/|\\)/g, "");
  if (useCloudStorage()) return (await downloadFromSupabase(PUBLIC_BUCKET, cleaned, true)).data;
  const publicRoot = path.resolve(ROOT, "public");
  const abs = path.resolve(publicRoot, cleaned);
  if (!abs.startsWith(publicRoot + path.sep)) throw new Error("Path escapes public media storage");
  return readFile(abs);
}

export async function readPrivateFile(rel: string) {
  if (useCloudStorage()) return downloadFromSupabase(PRIVATE_BUCKET, rel, false);
  const abs = safeRelative(rel);
  const info = await stat(abs);
  const data = await readFile(abs);
  return { data, size: info.size };
}

export async function deletePrivateFile(rel: string) {
  try {
    if (useCloudStorage()) {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(PRIVATE_BUCKET)}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [rel] }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Supabase Storage delete failed (${response.status})`);
      return;
    }
    await unlink(safeRelative(rel));
  } catch {
    // Preserve DB operations if an already-removed object cannot be deleted.
  }
}

export const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".zip": "application/zip",
};

export function contentTypeFor(rel: string) {
  return CONTENT_TYPES[path.extname(rel).toLowerCase()] || "application/octet-stream";
}

export function isImage(rel: string | null | undefined) {
  if (!rel) return false;
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(path.extname(rel).toLowerCase());
}
