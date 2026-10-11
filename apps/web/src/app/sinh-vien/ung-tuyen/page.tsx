"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api/client";

export default function MyApplicationsPage() {
  const openChat = useMutation({
    mutationFn: (applicationId: string) =>
      api.post<{ conversationId: string }>(
        `/conversations/application/${applicationId}`,
      ),
    onSuccess: (res) => {
      window.location.href = `/tin-nhan?c=${res.data.conversationId}`;
    },
    onError: () => toast.error("Không mở được hội thoại"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["applications", "me"],
    queryFn: async () => {
      const { data } = await api.get<
        Array<{
          applicationId: string;
          status: string;
          job?: { title: string; slug: string; company?: { companyName: string } };
        }>
      >("/applications/me");
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <RequireAuth roles={["STUDENT"]}>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">
            Hồ sơ đã ứng tuyển
          </h1>
          {isLoading && <p className="text-slate-600">Đang tải...</p>}
          <ul className="space-y-3">
            {data?.map((app) => (
              <li
                key={app.applicationId}
                className="rounded-xl border bg-white p-4 text-slate-800"
              >
                <Link
                  href={`/viec-lam/${app.job?.slug ?? ""}`}
                  className="font-medium text-blue-800 hover:underline"
                >
                  {app.job?.title}
                </Link>
                <p className="text-sm text-slate-600">
                  {app.job?.company?.companyName} · {app.status}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm text-blue-700 hover:underline"
                  onClick={() => openChat.mutate(app.applicationId)}
                >
                  Nhắn tin với công ty
                </button>
              </li>
            ))}
          </ul>
        </RequireAuth>
      </main>
    </div>
  );
}
