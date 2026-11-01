import { getStoredAccessToken } from "@/lib/api/client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function downloadCvAsset(assetId: string, fileName: string) {
  const token = getStoredAccessToken();
  const res = await fetch(`${API_BASE}/media/${assetId}/preview`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "cv";
  a.click();
  URL.revokeObjectURL(url);
}
