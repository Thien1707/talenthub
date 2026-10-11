"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";

export function EmailVerificationBanner() {
  const { user, refreshMe } = useAuth();

  const send = useMutation({
    mutationFn: () =>
      api.post<{ verifyUrl?: string; alreadyVerified?: boolean }>(
        "/auth/verify-email/send",
      ),
    onSuccess: (res) => {
      if (res.data.alreadyVerified) {
        toast.success("Email đã được xác thực");
        void refreshMe();
        return;
      }
      if (res.data.verifyUrl) {
        toast.message("Dev: mở liên kết xác thực", {
          description: res.data.verifyUrl,
          duration: 15_000,
        });
      } else {
        toast.success("Đã gửi liên kết xác thực (kiểm tra hộp thư)");
      }
    },
    onError: () => toast.error("Không gửi được liên kết xác thực"),
  });

  if (!user || user.emailVerifiedAt) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <span>
        Email <strong>{user.email}</strong> chưa xác thực.
      </span>
      <button
        type="button"
        disabled={send.isPending}
        onClick={() => send.mutate()}
        className="flex items-center gap-2 rounded-md bg-amber-700 px-3 py-1.5 text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {send.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Gửi liên kết xác thực
      </button>
    </div>
  );
}
