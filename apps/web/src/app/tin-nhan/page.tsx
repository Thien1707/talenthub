"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { ChatWorkspace } from "@/components/messaging/chat-workspace";
import { RequireAuth } from "@/components/require-auth";
import { SiteHeader } from "@/components/site-header";

function MessagesInner() {
  const { user } = useAuth();
  const params = useSearchParams();
  const c = params.get("c") ?? undefined;
  return <ChatWorkspace userId={user?.id} initialConversationId={c} />;
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <RequireAuth roles={["STUDENT", "COMPANY", "STAFF", "SUPER_ADMIN"]}>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Tin nhắn</h1>
          <Suspense fallback={<p>Đang tải...</p>}>
            <MessagesInner />
          </Suspense>
        </RequireAuth>
      </main>
    </div>
  );
}
