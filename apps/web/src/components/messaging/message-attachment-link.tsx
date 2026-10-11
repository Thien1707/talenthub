"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function MessageAttachmentLink({
  assetId,
  label,
  className,
}: {
  assetId: string;
  label: string;
  className?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["media", assetId, "signed-url"],
    queryFn: async () => {
      const { data: res } = await api.get<{ signedUrl: string }>(
        `/media/${assetId}/signed-url`,
      );
      return res.signedUrl;
    },
    staleTime: 3_000_000,
  });

  if (isLoading) {
    return <span className={`text-xs opacity-70 ${className ?? ""}`}>Đang tải…</span>;
  }
  if (!data) {
    return <span className={`text-xs ${className ?? ""}`}>{label}</span>;
  }
  return (
    <a
      href={data}
      target="_blank"
      rel="noreferrer"
      className={`mt-1 block text-xs underline ${className ?? ""}`}
    >
      {label}
    </a>
  );
}
