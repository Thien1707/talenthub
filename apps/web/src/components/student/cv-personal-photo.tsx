"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/api/upload";

type CvPersonalPhotoProps = {
  name: string;
  photoUrl?: string;
  editable?: boolean;
  accentColor: string;
  variant?: "sidebar" | "inline";
  onPhotoUrl: (url: string) => void;
};

export function CvPersonalPhoto({
  name,
  photoUrl,
  editable,
  accentColor,
  variant = "sidebar",
  onPhotoUrl,
}: CvPersonalPhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chọn file ảnh (JPEG, PNG, WebP…)");
      return;
    }
    setUploading(true);
    try {
      const { secureUrl } = await uploadMedia(file, "CV_PREVIEW");
      onPhotoUrl(secureUrl);
      toast.success("Đã thêm ảnh đại diện");
    } catch {
      toast.error("Upload ảnh thất bại — thử lại sau");
    } finally {
      setUploading(false);
    }
  };

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const sizeClass =
    variant === "sidebar"
      ? "mx-auto mb-4 h-20 w-20 text-2xl"
      : "mb-3 h-24 w-24 text-2xl";

  const inner = photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoUrl}
      alt=""
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <span className="font-light">{initial}</span>
  );

  return (
    <div className={`relative ${sizeClass}`}>
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white/40 text-white ${
          photoUrl ? "" : ""
        }`}
        style={{ backgroundColor: photoUrl ? undefined : `${accentColor}cc` }}
      >
        {inner}
      </div>
      {editable && (
        <>
          <button
            type="button"
            disabled={uploading}
            title="Tải ảnh lên"
            aria-label="Tải ảnh đại diện lên CV"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-900 text-white shadow-md hover:bg-violet-800 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
