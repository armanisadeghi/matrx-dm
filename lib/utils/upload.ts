import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type UploadResult = {
  url: string | null;
  error: string | null;
};

/**
 * Validates an image file before upload.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File must be a JPEG, PNG, WebP, or GIF image";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File must be smaller than 2MB";
  }
  return null;
}

/**
 * Uploads an avatar image to Supabase Storage.
 * @param file - The image file to upload
 * @param path - The storage path (e.g., "groups/abc-123" or "users/abc-123")
 * @param bucket - The storage bucket name (default: "avatars")
 */
export async function uploadAvatar(
  file: File,
  path: string,
  bucket: string = "avatars"
): Promise<UploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { url: null, error: validationError };
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${path}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  // Append cache-busting timestamp to force refresh
  const url = `${data.publicUrl}?t=${Date.now()}`;
  return { url, error: null };
}

/**
 * Creates a preview URL from a File object.
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a previously created preview URL to free memory.
 */
export function revokeFilePreview(url: string): void {
  URL.revokeObjectURL(url);
}
