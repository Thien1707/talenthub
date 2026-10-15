"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api/client";

type PlatformUser = {
  userId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: "STUDENT" | "COMPANY";
  status: string;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  studentProfile?: {
    schoolName?: string | null;
    major?: string | null;
    city?: string | null;
  } | null;
  companyProfile?: {
    companyName?: string;
    city?: string | null;
    verificationStatus?: string;
  } | null;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  PENDING: "Chờ xác thực",
  SUSPENDED: "Tạm khóa",
  BANNED: "Cấm",
};

function statusClass(status: string) {
  if (status === "ACTIVE") return "text-emerald-700 bg-emerald-50";
  if (status === "SUSPENDED" || status === "BANNED") return "text-red-700 bg-red-50";
  return "text-amber-700 bg-amber-50";
}

export function PlatformUsersManager() {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === "SUPER_ADMIN";
  const qc = useQueryClient();
  const [role, setRole] = useState<"" | "STUDENT" | "COMPANY">("");
  const [status, setStatus] = useState<"" | "ACTIVE" | "PENDING" | "SUSPENDED">(
    "ACTIVE",
  );
  const [search, setSearch] = useState("");
  const [passwordFor, setPasswordFor] = useState<PlatformUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", role, status, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "150");
      const { data: rows } = await api.get<PlatformUser[]>(
        `/admin/users?${params.toString()}`,
      );
      return rows;
    },
  });

  const resetPassword = useMutation({
    mutationFn: () =>
      api.patch(`/admin/users/${passwordFor!.userId}/password`, {
        newPassword,
      }),
    onSuccess: () => {
      toast.success("Đã đặt lại mật khẩu");
      setPasswordFor(null);
      setNewPassword("");
    },
    onError: () => toast.error("Đặt mật khẩu thất bại"),
  });

  const setUserStatus = useMutation({
    mutationFn: ({
      userId,
      status: next,
    }: {
      userId: string;
      status: string;
    }) => api.patch(`/admin/users/${userId}/status`, { status: next }),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Cập nhật trạng thái thất bại"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "" | "STUDENT" | "COMPANY")
          }
        >
          <option value="">SV + NTD</option>
          <option value="STUDENT">Sinh viên</option>
          <option value="COMPANY">Nhà tuyển dụng</option>
        </select>
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="">Mọi trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="PENDING">Chờ xác thực</option>
          <option value="SUSPENDED">Tạm khóa</option>
        </select>
        <input
          className="min-w-[200px] flex-1 rounded border px-2 py-1.5 text-sm"
          placeholder="Tìm email, tên, SĐT…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-slate-600">Đang tải…</p>}

      <ul className="divide-y rounded-xl border bg-white">
        {data?.map((u) => (
          <li
            key={u.userId}
            className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 text-sm"
          >
            <div>
              <p className="font-medium text-slate-900">
                {u.fullName}{" "}
                <span className="text-slate-500">
                  · {u.role === "STUDENT" ? "SV" : "NTD"}
                </span>
              </p>
              <p className="text-slate-600">{u.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                {u.role === "STUDENT"
                  ? [u.studentProfile?.schoolName, u.studentProfile?.major]
                      .filter(Boolean)
                      .join(" · ") || "—"
                  : u.companyProfile?.companyName ?? "—"}
                {u.companyProfile?.verificationStatus &&
                  u.role === "COMPANY" && (
                    <> · Xác minh: {u.companyProfile.verificationStatus}</>
                  )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Đăng nhập gần nhất:{" "}
                {u.lastLoginAt
                  ? new Date(u.lastLoginAt).toLocaleString("vi-VN")
                  : "Chưa từng"}
                {" · "}
                Tạo: {new Date(u.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <span
                className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass(u.status)}`}
              >
                {STATUS_LABEL[u.status] ?? u.status}
              </span>
            </div>
            {isSuperAdmin && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-blue-700 px-2 py-1 text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setPasswordFor(u);
                    setNewPassword("");
                  }}
                >
                  Đặt mật khẩu
                </button>
                {u.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-slate-700 hover:bg-slate-50"
                    onClick={() =>
                      setUserStatus.mutate({
                        userId: u.userId,
                        status: "SUSPENDED",
                      })
                    }
                  >
                    Tạm khóa
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-emerald-700 hover:bg-emerald-50"
                    onClick={() =>
                      setUserStatus.mutate({
                        userId: u.userId,
                        status: "ACTIVE",
                      })
                    }
                  >
                    Kích hoạt
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
        {!isLoading && data?.length === 0 && (
          <li className="px-4 py-8 text-center text-slate-500">
            Không có tài khoản phù hợp bộ lọc.
          </li>
        )}
      </ul>

      {passwordFor && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="font-semibold text-slate-900">Đặt lại mật khẩu</h3>
            <p className="mt-1 text-sm text-slate-600">
              {passwordFor.fullName} · {passwordFor.email}
            </p>
            <input
              type="password"
              className="mt-3 w-full rounded border px-3 py-2 text-sm"
              placeholder="Mật khẩu mới (≥ 8 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border px-3 py-2 text-sm"
                onClick={() => setPasswordFor(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={newPassword.length < 8 || resetPassword.isPending}
                className="rounded bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() => resetPassword.mutate()}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {!isSuperAdmin && (
        <p className="text-xs text-slate-500">
          Staff chỉ xem danh sách. Super Admin mới đặt mật khẩu / khóa tài khoản.
        </p>
      )}
    </div>
  );
}
