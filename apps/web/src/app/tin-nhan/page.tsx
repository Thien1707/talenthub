"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ChatWorkspace } from "@/components/messaging/chat-workspace";
import { RequireAuth } from "@/components/require-auth";

function MessagesInner() {
  const { user } = useAuth();
  const params = useSearchParams();
  const c = params.get("c") ?? undefined;
  return <ChatWorkspace userId={user?.id} initialConversationId={c} />;
}

export default function MessagesPage() {
  return (
    <AppShell title="Tin nhắn" description="Trao đổi với nhà tuyển dụng hoặc ứng viên.">
      <RequireAuth roles={["STUDENT", "COMPANY", "STAFF", "SUPER_ADMIN"]}>
        <Suspense fallback={<p className="text-sm text-slate-500">Đang tải…</p>}>
          <MessagesInner />
        </Suspense>
      </RequireAuth>
    </AppShell>
  );
}
