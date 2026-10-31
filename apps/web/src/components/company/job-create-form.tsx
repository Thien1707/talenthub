"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/extract-api-error";
import { formatVND, parseVndAmount } from "@/lib/format-money";
import { MoneyInput } from "@/components/ui/money-input";

type Category = { categoryId: string; categoryName: string };

/** Khớp backend MAX_VND_SALARY */
const MAX_SALARY_VND = 999_999_999_999;

type FieldErrors = Partial<
  Record<
    | "title"
    | "categoryId"
    | "description"
    | "requirements"
    | "location"
    | "salaryMin"
    | "salaryMax",
    string
  >
>;

export function JobCreateForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    requirements: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    salaryNegotiable: false,
    jobType: "NORMAL" as "NORMAL" | "VIP",
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/categories");
      return data;
    },
  });

  function validateClient(): FieldErrors {
    const err: FieldErrors = {};
    if (!form.title.trim()) err.title = "Nhập tiêu đề tin tuyển dụng.";
    if (!form.categoryId) err.categoryId = "Chọn danh mục ngành nghề.";
    if (!form.location.trim()) err.location = "Nhập địa điểm làm việc.";
    if (!form.description.trim()) err.description = "Nhập mô tả công việc.";
    if (!form.requirements.trim()) err.requirements = "Nhập yêu cầu ứng viên.";

    if (form.salaryNegotiable) return err;

    const min = form.salaryMin.trim() ? parseVndAmount(form.salaryMin) : null;
    const max = form.salaryMax.trim() ? parseVndAmount(form.salaryMax) : null;
    if (form.salaryMin.trim() && min === null) {
      err.salaryMin = "Lương tối thiểu phải là số hợp lệ.";
    }
    if (form.salaryMax.trim() && max === null) {
      err.salaryMax = "Lương tối đa phải là số hợp lệ.";
    }
    if (min !== null && min < 0) err.salaryMin = "Lương không được âm.";
    if (max !== null && max < 0) err.salaryMax = "Lương không được âm.";
    if (min !== null && min > MAX_SALARY_VND) {
      err.salaryMin = `Lương tối đa ${formatVND(MAX_SALARY_VND)}.`;
    }
    if (max !== null && max > MAX_SALARY_VND) {
      err.salaryMax = `Lương tối đa ${formatVND(MAX_SALARY_VND)}.`;
    }
    if (min !== null && max !== null && min > max) {
      err.salaryMax = "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.";
    }
    return err;
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        location: form.location.trim(),
        jobType: form.jobType,
        salaryCurrency: "VND",
        salaryMin:
          !form.salaryNegotiable && form.salaryMin.trim()
            ? parseVndAmount(form.salaryMin) ?? undefined
            : undefined,
        salaryMax:
          !form.salaryNegotiable && form.salaryMax.trim()
            ? parseVndAmount(form.salaryMax) ?? undefined
            : undefined,
      };
      const { data } = await api.post<{ jobId: string }>("/jobs/company", payload);
      return data;
    },
    onSuccess: (data) => {
      const id = data?.jobId;
      if (!id) {
        toast.error("API không trả về mã tin — không thể chuyển sang thanh toán.");
        return;
      }
      void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
      router.push(`/cong-ty/tin-tuyen-dung/${id}/dang-tin`);
    },
    onError: (err: unknown) => {
      toast.error(
        extractApiErrorMessage(err, "Không lưu được tin nháp. Kiểm tra API đang chạy."),
      );
    },
  });

  const handleContinue = () => {
    const err = validateClient();
    setFieldErrors(err);
    if (Object.keys(err).length > 0) {
      toast.error("Vui lòng sửa các trường được đánh dấu.");
      return;
    }
    save.mutate();
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full rounded-lg border px-3 py-2 ${
      fieldErrors[field] ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
    }`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        <div>
          <input
            placeholder="Tiêu đề công việc *"
            className={inputClass("title")}
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: undefined });
            }}
          />
          {fieldErrors.title ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
          ) : null}
        </div>
        <div>
          <select
            className={inputClass("categoryId")}
            value={form.categoryId}
            onChange={(e) => {
              setForm({ ...form, categoryId: e.target.value });
              if (fieldErrors.categoryId)
                setFieldErrors({ ...fieldErrors, categoryId: undefined });
            }}
          >
            <option value="">Chọn danh mục *</option>
            {categories?.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.categoryId}</p>
          ) : null}
        </div>
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={form.jobType}
          onChange={(e) =>
            setForm({ ...form, jobType: e.target.value as "NORMAL" | "VIP" })
          }
        >
          <option value="NORMAL">Tin thường</option>
          <option value="VIP">Tin VIP (luôn tính phí đăng)</option>
        </select>
        <div>
          <input
            placeholder="Địa điểm *"
            className={inputClass("location")}
            value={form.location}
            onChange={(e) => {
              setForm({ ...form, location: e.target.value });
              if (fieldErrors.location)
                setFieldErrors({ ...fieldErrors, location: undefined });
            }}
          />
          {fieldErrors.location ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p>
          ) : null}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.salaryNegotiable}
            onChange={(e) => {
              const checked = e.target.checked;
              setForm({
                ...form,
                salaryNegotiable: checked,
                salaryMin: checked ? "" : form.salaryMin,
                salaryMax: checked ? "" : form.salaryMax,
              });
              if (checked) {
                setFieldErrors({
                  ...fieldErrors,
                  salaryMin: undefined,
                  salaryMax: undefined,
                });
              }
            }}
          />
          Lương thỏa thuận (không hiển thị khoảng lương cụ thể)
        </label>
        <p className="text-xs text-slate-500">
          Hoặc nhập khoảng lương có dấu phẩy (vd. 15,000,000 – 25,000,000 VND/tháng).
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <MoneyInput
              digits={form.salaryMin}
              placeholder="Lương tối thiểu"
              disabled={form.salaryNegotiable}
              className={inputClass("salaryMin")}
              onDigitsChange={(digits) => {
                setForm({
                  ...form,
                  salaryMin: digits,
                  salaryNegotiable: false,
                });
                if (fieldErrors.salaryMin)
                  setFieldErrors({ ...fieldErrors, salaryMin: undefined });
              }}
            />
            {fieldErrors.salaryMin ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.salaryMin}</p>
            ) : null}
          </div>
          <div>
            <MoneyInput
              digits={form.salaryMax}
              placeholder="Lương tối đa"
              disabled={form.salaryNegotiable}
              className={inputClass("salaryMax")}
              onDigitsChange={(digits) => {
                setForm({
                  ...form,
                  salaryMax: digits,
                  salaryNegotiable: false,
                });
                if (fieldErrors.salaryMax)
                  setFieldErrors({ ...fieldErrors, salaryMax: undefined });
              }}
            />
            {fieldErrors.salaryMax ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.salaryMax}</p>
            ) : null}
          </div>
        </div>
        <div>
          <textarea
            placeholder="Mô tả công việc *"
            rows={4}
            className={inputClass("description")}
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              if (fieldErrors.description)
                setFieldErrors({ ...fieldErrors, description: undefined });
            }}
          />
          {fieldErrors.description ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
          ) : null}
        </div>
        <div>
          <textarea
            placeholder="Yêu cầu ứng viên *"
            rows={4}
            className={inputClass("requirements")}
            value={form.requirements}
            onChange={(e) => {
              setForm({ ...form, requirements: e.target.value });
              if (fieldErrors.requirements)
                setFieldErrors({ ...fieldErrors, requirements: undefined });
            }}
          />
          {fieldErrors.requirements ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.requirements}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={save.isPending}
          onClick={handleContinue}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Tiếp tục — thanh toán &amp; gửi duyệt
        </button>
      </div>
    </section>
  );
}
