import { supabase } from "./supabase";

type UploadImageProps = {
  file: File;
  bucket: string;
  path: string;
};
type DeleteImageProps = {
  path: string;
  bucket: string;
};

export const uploadImage = async ({ file, bucket, path }: UploadImageProps) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      cacheControl: "0",
    });

  if (error) {
    // Surface the real Supabase error instead of swallowing it — callers
    // used to only ever see a generic "Image Upload failed" because this
    // returned null either way. Throwing lets the UI show the actual
    // reason (bad/expired API key, bucket RLS rejection, bad path, etc).
    console.error("uploadImage failed:", error);
    throw new Error(error.message || "Image upload failed");
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl.publicUrl;
};

export const deleteImage = async ({ path, bucket }: DeleteImageProps) => {
  const { data, error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error(error);
    return null;
  }
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl.publicUrl;
};
