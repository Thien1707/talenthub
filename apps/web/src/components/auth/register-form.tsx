"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { dashboardPath } from "@/components/auth-provider";
import { api, setAccessToken } from "@/lib/api/client";
import {
  registerCompanySchema,
  registerStudentSchema,
  type RegisterCompanyForm,
  type RegisterStudentForm,
} from "@/lib/auth/schemas";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const isCompany = searchParams.get("role") === "company";
  const router = useRouter();

  const schema = useMemo(
    () => (isCompany ? registerCompanySchema : registerStudentSchema),
    [isCompany],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStudentForm | RegisterCompanyForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const path = isCompany ? "/auth/register/company" : "/auth/register/student";
      const { data } = await api.post<{ accessToken: string; user: { role: "STUDENT" | "COMPANY" } }>(
        path,
        values,
      );
      setAccessToken(data.accessToken);
      toast.success("Đăng ký thành công");
      router.push(dashboardPath(data.user.role));
    } catch {
      toast.error("Không thể đăng ký. Email có thể đã tồn tại.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
        <Link
          href="/dang-ky"
          className={`flex-1 rounded-md py-2 text-center text-sm ${!isCompany ? "bg-white shadow" : ""}`}
        >
          Sinh viên
        </Link>
        <Link
          href="/dang-ky?role=company"
          className={`flex-1 rounded-md py-2 text-center text-sm ${isCompany ? "bg-white shadow" : ""}`}
        >
          Công ty
        </Link>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">
          Họ tên
        </label>
        <input
          className="input-field"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>
      {isCompany && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Tên công ty
          </label>
          <input
            className="input-field"
            {...register("companyName" as keyof RegisterCompanyForm)}
          />
          {"companyName" in errors && errors.companyName && (
            <p className="mt-1 text-sm text-red-600">
              {(errors.companyName as { message?: string }).message}
            </p>
          )}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          type="email"
          className="input-field"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800">
          Mật khẩu
        </label>
        <input
          type="password"
          className="input-field"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="button button-primary w-full py-3"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Tạo tài khoản
      </button>
    </form>
  );
}
