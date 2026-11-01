"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";

export function SaveJobButton({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: saved } = useQuery({
    queryKey: ["saved-jobs"],
    enabled: user?.role === "STUDENT",
    queryFn: async () => {
      const { data } = await api.get<Array<{ jobId: string }>>("/saved-jobs");
      return data;
    },
  });

  const isSaved = saved?.some((s) => s.jobId === jobId);

  const toggle = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await api.delete(`/saved-jobs/${jobId}`);
      } else {
        await api.post(`/saved-jobs/${jobId}`);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["saved-jobs"] });
      toast.success(isSaved ? "Đã bỏ lưu" : "Đã lưu tin");
    },
    onError: () => toast.error("Thao tác thất bại"),
  });

  if (!user || user.role !== "STUDENT") return null;

  return (
    <button
      type="button"
      disabled={toggle.isPending}
      onClick={() => toggle.mutate()}
      className="button button-secondary w-full justify-center"
    >
      <Bookmark
        className={`h-4 w-4 ${isSaved ? "fill-amber-500 text-amber-600" : ""}`}
        aria-hidden
      />
      {isSaved ? "Đã lưu tin" : "Lưu tin"}
    </button>
  );
}
