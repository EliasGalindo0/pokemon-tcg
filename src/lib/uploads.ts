import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";

const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function uploadsDir() {
  return path.resolve(process.cwd(), "public", "uploads");
}

export async function saveUpload(file: File) {
  const extension = EXTENSIONS[file.type];
  if (!extension) {
    throw new AppError("Envie uma imagem JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new AppError("A imagem deve ter no máximo 5 MB.");
  }

  const filename = `${randomUUID()}.${extension}`;
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}

export async function deleteUpload(url: string | null) {
  if (!url?.startsWith("/uploads/")) return;
  const filename = path.basename(url);
  if (!/^[a-zA-Z0-9.-]+$/.test(filename)) return;

  const dir = uploadsDir();
  const full = path.resolve(dir, filename);
  if (!full.startsWith(dir + path.sep)) return;
  await unlink(full).catch(() => undefined);
}
