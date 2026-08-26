import { supabase } from "@/app/util/supabase";

/**
 * Uploads a File or base64 dataURL to Supabase Storage and returns the public URL.
 * Falls back to returning the dataURL as-is if Supabase is not configured.
 */
export async function uploadImage(
  fileOrDataUrl: File | string,
  bucket = "images",
  folder = "uploads"
): Promise<string> {
  // If it's not a dataURL/File just return as-is (already a URL)
  if (typeof fileOrDataUrl === "string" && !fileOrDataUrl.startsWith("data:")) {
    return fileOrDataUrl;
  }

  try {
    let file: File;
    if (typeof fileOrDataUrl === "string") {
      // Convert base64 dataURL → File
      const res = await fetch(fileOrDataUrl);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1] || "jpg";
      file = new File([blob], `upload_${Date.now()}.${ext}`, { type: blob.type });
    } else {
      file = fileOrDataUrl;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.warn("Supabase upload error, using dataURL fallback:", error.message);
      // Fall back: return the original dataURL (will work visually but won't persist cross-device)
      return typeof fileOrDataUrl === "string" ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn("Image upload failed, using fallback:", e);
    return typeof fileOrDataUrl === "string" ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl as File);
  }
}
