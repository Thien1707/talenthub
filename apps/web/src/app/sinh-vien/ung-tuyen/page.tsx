"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { StudentSubnav } from "@/components/ui/student-subnav";
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
    <AppShell
      title="Hồ sơ đã ứng tuyển"
      description="Theo dõi trạng thái và nhắn tin với nhà tuyển dụng."
    >
      <RequireAuth roles={["STUDENT"]}>
        <StudentSubnav />
        {isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}
        <ul className="grid gap-4">
          {data?.map((app) => (
            <li key={app.applicationId} className="th-card">
              <Link
                href={`/viec-lam/${app.job?.slug ?? ""}`}
                className="font-bold text-slate-900 hover:text-blue-600"
              >
                {app.job?.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600">
                {app.job?.company?.companyName} ·{" "}
                <span className="font-semibold">{app.status}</span>
              </p>
              <button
                type="button"
                className="text-link mt-3"
                onClick={() => openChat.mutate(app.applicationId)}
              >
                Nhắn tin với công ty
              </button>
            </li>
          ))}
          {!isLoading && data?.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-slate-500">
              Bạn chưa ứng tuyển tin nào.
            </li>
          )}
        </ul>
      </RequireAuth>
    </AppShell>
  );
}
