"use client";

import * as React from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type UploadBucket = "course-thumbnails" | "course-videos";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Direct-to-storage upload for instructors.
 *
 * The object path MUST begin with the uploader's user id — that is exactly what
 * the storage RLS policy checks, so a user cannot overwrite another user's file
 * by guessing a path.
 *
 *   course-thumbnails/{uid}/cover-<ts>.webp
 *   course-videos/{uid}/lesson-<ts>.mp4
 */
export function useStorageUpload() {
  const [progress, setProgress] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const upload = React.useCallback(
    async (file: File, bucket: UploadBucket): Promise<UploadResult | null> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("You must be signed in to upload files.");

        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const prefix = bucket === "course-thumbnails" ? "cover" : "lesson";
        const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;

        // Supabase JS does not expose upload progress, so we simulate a
        // determinate bar around the request lifecycle.
        setProgress(15);

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (upErr) throw new Error(upErr.message);

        setProgress(90);

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setProgress(100);

        return { path, publicUrl: data.publicUrl };
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return { upload, uploading, progress, error };
}
