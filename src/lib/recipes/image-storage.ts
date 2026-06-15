import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

import { UPLOAD_CONFIG } from '@/config/upload';

// Filesystem helpers for recipe photos. The binary lives under
// UPLOAD_CONFIG.UPLOAD_DIR; only the returned file name is persisted in the
// recipes.image_path column. See ARCH-009.

function uploadDir(): string {
  return path.join(process.cwd(), UPLOAD_CONFIG.UPLOAD_DIR);
}

function extensionFor(file: File): string {
  return file.type === 'image/png' ? '.png' : '.jpg';
}

/**
 * Persist an uploaded recipe photo to disk and return its stored file name.
 */
export async function saveRecipeImage(recipeId: number, file: File): Promise<string> {
  const dir = uploadDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileName = `recipe-${recipeId}-${randomUUID()}${extensionFor(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, fileName), buffer);

  return fileName;
}

/**
 * Resolve the absolute path of a stored recipe photo from its file name.
 */
export function getRecipeImagePath(fileName: string): string {
  return path.join(uploadDir(), fileName);
}

/**
 * Delete a stored recipe photo if it exists. Safe to call with a stale name.
 */
export function deleteRecipeImage(fileName: string | null | undefined): void {
  if (!fileName) {
    return;
  }
  const filePath = getRecipeImagePath(fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Map a stored file name to the MIME type used when serving it.
 */
export function contentTypeFor(fileName: string): string {
  return fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}
