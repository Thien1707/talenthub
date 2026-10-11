"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type LogRow = {
  moderationLogId: string;
  targetType: string;
  targetId: string;
  action: string;
  reason?: string | null;
  createdAt: string;
  actor?: { fullName: string; role: string };
};

export function ModerationLogsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["moderation", "logs"],
    queryFn: async () => {
      const { data } = await api.get<LogRow[]>("/moderation/logs");
      return data;
    },
  });

  if (isLoading) return <p className="text-slate-600">Đang tải...</p>;

  return (
    <ul className="space-y-2">
      {data?.map((log) => (
        <li
          key={log.moderationLogId}
          className="rounded-lg border bg-white px-3 py-2 text-sm text-slate-800"
        >
          <span className="font-medium">{log.action}</span> · {log.targetType} #
          {log.targetId}
          <span className="text-slate-500">
            {" "}
            — {log.actor?.fullName} ({log.actor?.role})
          </span>
          {log.reason && (
            <p className="text-xs text-slate-600">{log.reason}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
