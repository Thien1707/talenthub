import { api } from "@/lib/api/client";

export async function uploadMedia(
  file: File,
  assetType: string,
): Promise<{ assetId: string; secureUrl: string }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ assetId: string; secureUrl: string }>(
    `/media/upload?assetType=${encodeURIComponent(assetType)}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}
