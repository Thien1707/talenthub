"use client";

import {
  navbarDashboardPath,
  profilePath,
  useAuth,
  type AuthUser,
} from "@/components/auth-provider";
import {
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function UserAvatar({
  fullName,
  size = "md",
}: {
  fullName?: string;
  size?: "md" | "sm";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  if (!fullName) {
    return (
      <span
        className={`grid ${dim} place-items-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-white`}
      >
        <User className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={`grid ${dim} place-items-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white ring-2 ring-white shadow-sm`}
      aria-hidden
    >
      {initials(fullName)}
    </span>
  );
}

type MenuItemProps = {
  href?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
};

function MenuItem({ href, icon, label, onClick, variant = "default" }: MenuItemProps) {
  const className = `flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
    variant === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
  }`;
  if (href) {
    return (
      <Link href={href} className={className} role="menuitem" onClick={onClick}>
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={className} role="menuitem" onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function GuestMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-1" role="menu">
      <MenuItem
        href="/dang-nhap"
        icon={<UserCircle className="h-4 w-4 shrink-0 text-slate-400" />}
        label="Đăng nhập"
        onClick={onClose}
      />
      <MenuItem
        href="/dang-ky"
        icon={<User className="h-4 w-4 shrink-0 text-slate-400" />}
        label="Đăng ký"
        onClick={onClose}
      />
    </div>
  );
}

function AuthenticatedMenu({
  user,
  onClose,
  onLogout,
}: {
  user: AuthUser & { email: string; fullName: string };
  onClose: () => void;
  onLogout: () => void;
}) {
  const dash = navbarDashboardPath(user.role);
  const profile = profilePath(user.role);
  const iconCls = "h-4 w-4 shrink-0 text-slate-400";

  return (
    <div role="menu">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar fullName={user.fullName} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{user.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="py-1">
        <MenuItem
          href={dash}
          icon={<LayoutDashboard className={iconCls} />}
          label="Bảng điều khiển"
          onClick={onClose}
        />
        <MenuItem
          href={profile}
          icon={<User className={iconCls} />}
          label="Thông tin cá nhân"
          onClick={onClose}
        />
        <MenuItem
          href="/cai-dat/mat-khau"
          icon={<Settings className={iconCls} />}
          label="Cài đặt tài khoản"
          onClick={onClose}
        />
        <MenuItem
          href="/cai-dat/mat-khau"
          icon={<KeyRound className={iconCls} />}
          label="Đổi mật khẩu"
          onClick={onClose}
        />
      </div>
      <div className="border-t border-slate-100 py-1">
        <MenuItem
          icon={<LogOut className={iconCls} />}
          label="Đăng xuất"
          variant="danger"
          onClick={onLogout}
        />
      </div>
    </div>
  );
}

export function UserAccountMenu() {
  const menuId = useId();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const handleLogout = useCallback(async () => {
    close();
    await logout();
    router.push("/");
    router.refresh();
  }, [close, logout, router]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, close]);

  if (loading) {
    return (
      <div
        className="h-9 w-9 animate-pulse rounded-full bg-slate-100"
        aria-hidden
      />
    );
  }

  const label = user
    ? `Tài khoản ${user.fullName}`
    : "Tài khoản — đăng nhập hoặc đăng ký";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${menuId}-menu`}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full p-0.5 outline-none transition hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-100"
      >
        <UserAvatar fullName={user?.fullName} />
        {user && (
          <ChevronDown
            className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        )}
      </button>

      <div
        id={`${menuId}-menu`}
        role="menu"
        aria-labelledby={`${menuId}-trigger`}
        className={`absolute right-0 z-[60] mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 transition-all duration-200 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        {user ? (
          <AuthenticatedMenu user={user} onClose={close} onLogout={() => void handleLogout()} />
        ) : (
          <GuestMenu onClose={close} />
        )}
      </div>
    </div>
  );
}
