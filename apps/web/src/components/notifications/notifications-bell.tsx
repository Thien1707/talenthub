"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";

type NotificationRow = {
  notificationId: string;
  title: string;
  content: string;
  isRead: boolean;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ["notifications", "unread"],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>(
        "/notifications/me/unread-count",
      );
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["notifications", "me"],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await api.get<NotificationRow[]>("/notifications/me");
      return data;
    },
  });

  const markAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!user) return null;

  const count = countData?.count ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-slate-700 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold text-slate-900">Thông báo</span>
            <button
              type="button"
              className="text-xs text-blue-700 hover:underline"
              onClick={() => markAll.mutate()}
            >
              Đọc tất cả
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items?.map((n) => (
              <li
                key={n.notificationId}
                className={`border-b px-3 py-2 text-sm last:border-0 ${
                  n.isRead ? "text-slate-600" : "bg-blue-50/50 text-slate-900"
                }`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="line-clamp-2 text-xs">{n.content}</p>
                {n.referenceType === "CONVERSATION" && n.referenceId && (
                  <Link
                    href={`/tin-nhan?c=${n.referenceId}`}
                    className="text-xs text-blue-700 hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    Mở tin nhắn
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
