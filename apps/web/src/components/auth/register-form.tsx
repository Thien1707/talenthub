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
import formStyles from "./auth-forms.module.css";

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
      const { data } = await api.post<{
        accessToken: string;
        user: { role: "STUDENT" | "COMPANY" };
      }>(path, values);
      setAccessToken(data.accessToken);
      toast.success("Đăng ký thành công");
      router.push(dashboardPath(data.user.role));
    } catch {
      toast.error("Không thể đăng ký. Email có thể đã tồn tại.");
    }
  });

  return (
    <form onSubmit={onSubmit} className={formStyles.form} aria-label="Đăng ký">
      <div className={formStyles.roleSwitch} role="group" aria-label="Loại tài khoản">
        <Link
          href="/dang-ky"
          className={`${formStyles.roleLink} ${!isCompany ? formStyles.roleLinkActive : ""}`}
        >
          Sinh viên
        </Link>
        <Link
          href="/dang-ky?role=company"
          className={`${formStyles.roleLink} ${isCompany ? formStyles.roleLinkActive : ""}`}
        >
          Công ty
        </Link>
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="register-fullName">
          Họ tên
        </label>
        <input id="register-fullName" className="input-field" {...register("fullName")} />
        {errors.fullName && (
          <p className={formStyles.error}>{errors.fullName.message}</p>
        )}
      </div>

      {isCompany && (
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="register-companyName">
            Tên công ty
          </label>
          <input
            id="register-companyName"
            className="input-field"
            {...register("companyName" as keyof RegisterCompanyForm)}
          />
          {"companyName" in errors && errors.companyName && (
            <p className={formStyles.error}>
              {(errors.companyName as { message?: string }).message}
            </p>
          )}
        </div>
      )}

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          className="input-field"
          {...register("email")}
        />
        {errors.email && (
          <p className={formStyles.error}>{errors.email.message}</p>
        )}
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="register-password">
          Mật khẩu
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          className="input-field"
          {...register("password")}
        />
        {errors.password && (
          <p className={formStyles.error}>{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`button button-primary ${formStyles.submit}`}
      >
        {isSubmitting && (
          <Loader2 className="mr-1 inline h-4 w-4 animate-spin" aria-hidden />
        )}
        Tạo tài khoản miễn phí
      </button>
    </form>
  );
}
