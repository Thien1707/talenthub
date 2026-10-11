"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

type ReviewRow = {
  reviewId: string;
  rating: number;
  comment?: string | null;
  reviewer?: { fullName: string };
  reviewed?: { fullName: string };
};

export function ReviewsQueue() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", "pending"],
    queryFn: async () => {
      const { data } = await api.get<ReviewRow[]>("/reviews/staff/pending");
      return data;
    },
  });

  const moderate = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "PUBLISHED" | "HIDDEN";
    }) => api.patch(`/reviews/staff/${id}`, { status }),
    onSuccess: () => {
      toast.success("Đã duyệt đánh giá");
      void qc.invalidateQueries({ queryKey: ["reviews", "pending"] });
    },
  });

  if (isLoading) return <p className="text-slate-600">Đang tải...</p>;

  return (
    <ul className="space-y-3">
      {data?.map((r) => (
        <li key={r.reviewId} className="rounded-xl border bg-white p-4 text-sm">
          <p>
            {r.reviewer?.fullName} → {r.reviewed?.fullName} · {r.rating}/5
          </p>
          {r.comment && <p className="text-slate-600">{r.comment}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" className="text-emerald-700" onClick={() => moderate.mutate({ id: r.reviewId, status: "PUBLISHED" })}>
              Công khai
            </button>
            <button type="button" className="text-red-700" onClick={() => moderate.mutate({ id: r.reviewId, status: "HIDDEN" })}>
              Ẩn
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
