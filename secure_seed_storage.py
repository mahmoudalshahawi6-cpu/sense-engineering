from pathlib import Path
import re
root=Path('/mnt/data/sense_work')
def r(p): return (root/p).read_text(encoding='utf-8')
def w(p,s): (root/p).write_text(s,encoding='utf-8')

# Seed script must not create accounts with known passwords, sample orders, or preset payment details.
p='scripts/seed.mjs'; s=r(p)
s=s.replace('import { randomBytes, scryptSync } from "crypto";\n','')
# Remove password hasher helper
s=re.sub(r'\nfunction hashPassword\(password\) \{.*?\n\}\n', '\n', s, flags=re.S)
# Clear example preview URLs/captions and prices - all library records stay unpublished until owner reviews them.
s=s.replace('videoUrl: "https://www.youtube.com/watch?v=H221aVeA1KI",','videoUrl: "",')
s=s.replace('videoUrl: "https://www.youtube.com/watch?v=h7gixywOkXM",','videoUrl: "",')
s=s.replace('videoUrl: "https://www.youtube.com/watch?v=afBHqs5t6FU",','videoUrl: "",')
s=re.sub(r'\n\s*videoCaption:\n\s*"[^"]*",','\n    videoCaption: "أضف رابط فيديو المعاينة المجاني من لوحة الإدارة قبل النشر.",',s)
s=s.replace('price: 850,\n    discount: 650,','price: 0,\n    discount: null,')
s=s.replace('price: 750,\n    discount: 590,','price: 0,\n    discount: null,')
s=s.replace('price: 650,\n    discount: 490,','price: 0,\n    discount: null,')
# Remove PAYMENT constant through before main
s=re.sub(r'\nconst PAYMENT = \[.*?\n\];\n\nasync function main\(\)', '\nasync function main()', s, flags=re.S)
# Remove seed user and payment setup blocks
s=re.sub(r'\n  // users\n.*?\n  // libraries \+ sections \+ resources\n', '\n  console.log("Preparing unpublished library drafts (no demo accounts or payment data are created).");\n\n  // libraries + sections + resources\n', s, flags=re.S)
# SQL seed: prices neutral, no library published by default
s=s.replace('''       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,true,$14) returning id''','''       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,false,$14) returning id''')
s=s.replace('''        String(lib.price),
        String(lib.discount),''','''        "0",
        null,''')
s=s.replace('''             is_free, published, sort_order)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10)''','''             is_free, published, sort_order)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,$10)''')
s=s.replace('''            kind === "video" && sec.code === "00" ? lib.videoUrl : kind === "link" ? "https://www.google.com/search?q=" + encodeURIComponent(title) : null,''','''            null,''')
# Remove demo entitlement block
s=re.sub(r'\n  // demo entitlement for member@edl\.com on mechatronics.*?\n  console\.log\("Seed completed\."\);', '\n  console.log("Seed completed. Four unpublished draft libraries and their section/resource outlines are ready for review.");', s, flags=re.S)
# Remove now-unused `const DATABASE_URL...` fallback? preserve local development but demand explicit configured database for safety.
s=s.replace('''const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const pool = new pg.Pool({ connectionString: DATABASE_URL });''','''const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL غير مضبوط. أضفه إلى متغيرات البيئة قبل تشغيل seed.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: DATABASE_URL });''')
w(p,s)

# Keep the project source archive private, not public.
p='scripts/build-zip.mjs'; w(p, '''import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const privateDir = path.join(rootDir, "storage", "admin-downloads");
const zipPath = path.join(privateDir, "sense-project-source.zip");
fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

console.log("Generating private project ZIP archive...");
execSync(
  `zip -r "${zipPath}" . ` +
    `-x "node_modules/*" ` +
    `-x ".next/*" ` +
    `-x "storage/*" ` +
    `-x ".git/*" ` +
    `-x "*.log" ` +
    `-x ".env" ` +
    `-x ".env.*" ` +
    `-x "!.env.example"`,
  { stdio: "inherit" }
);
const stats = fs.statSync(zipPath);
console.log(`Private project ZIP created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
''')

# Admin-only download endpoint; never expose project source from a public path.
w('src/app/api/download/route.ts', '''import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const storageRoot = path.resolve(process.env.PRIVATE_STORAGE_DIR || path.join(process.cwd(), "storage"));
    const zipPath = path.join(storageRoot, "admin-downloads", "sense-project-source.zip");
    const fileStat = await stat(zipPath);
    const fileBuffer = await readFile(zipPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="sense-project-source.zip"',
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "ملف المصدر الخاص غير جاهز. شغّل npm run build:source من جهاز الإدارة." },
      { status: 404 }
    );
  }
}
''')

# Storage adapter: local disk for development, Supabase Storage REST API for persistent serverless deployment.
w('src/lib/storage.ts', '''import { mkdir, readFile, writeFile, unlink, stat } from "fs/promises";
import path from "path";

/**
 * File storage adapter.
 * Local disk is suitable for development or a server with a persistent volume.
 * On Netlify/Vercel/serverless deployments, configure a private Supabase Storage bucket
 * and a separate public bucket for cover images. The service-role key stays server-side.
 */
const ROOT = path.resolve(process.env.PRIVATE_STORAGE_DIR || path.join(process.cwd(), "storage"));
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || "sense-private";
const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || "sense-media";

function useCloudStorage() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function encodeObjectPath(rel: string) {
  return rel.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function safeRelative(rel: string) {
  const cleaned = rel.replace(/^\\/+/, "").replace(/\\.\\.(\\/|\\\\)/g, "");
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
  const base = path.basename(name, path.extname(name)).replace(/[^\\w\\u0600-\\u06FF-]+/g, "_").slice(0, 60);
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
  const cleaned = rel.replace(/^\\/+/, "").replace(/\\.\\.(\\/|\\\\)/g, "");
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
''')
