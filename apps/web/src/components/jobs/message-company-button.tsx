"use client";

import { useMutation } from "@tanstack/react-query";
import { MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";

export function MessageCompanyButton({
  companyId,
}: {
  companyId: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const openChat = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ conversationId: string }>(
        `/conversations/company/${companyId}`,
      );
      return data;
    },
    onSuccess: ({ conversationId }) => {
      router.push(`/tin-nhan?c=${encodeURIComponent(conversationId)}`);
    },
    onError: () => toast.error("Không mở được hội thoại với công ty."),
  });

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/dang-nhap"
        className="button button-secondary mt-2 w-full justify-center"
      >
        <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
        Đăng nhập để nhắn tin
      </Link>
    );
  }

  if (user.role !== "STUDENT") return null;

  return (
    <button
      type="button"
      disabled={openChat.isPending}
      onClick={() => openChat.mutate()}
      className="button button-secondary mt-2 w-full justify-center"
    >
      {openChat.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
      )}
      Nhắn tin với công ty
    </button>
  );
}
