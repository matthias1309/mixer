export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
  UPLOAD_DIR: '.data/uploads/recipes',
  TEMP_DIR: '.data/uploads/temp',
} as const;

export function isValidFile(file: File): boolean {
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return false;
  }
  if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }
  return true;
}

export function getValidationError(file: File): string | null {
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return 'File must be smaller than 5MB';
  }
  if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only JPG and PNG files are supported';
  }
  return null;
}

export function sanitizeFilename(filename: string): string {
  // Remove special characters, keep only alphanumeric, dash, underscore
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Max filename length
}
