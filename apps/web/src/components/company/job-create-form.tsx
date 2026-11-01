"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/ui/money-input";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/extract-api-error";
import { formatVND, parseVndAmount } from "@/lib/format-money";
import shell from "./company-jobs-panel.module.css";
import profilePaper from "./company-profile-form.module.css";
import styles from "./job-create-form.module.css";

type Category = { categoryId: string; categoryName: string };

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

  const categoryName =
    categories?.find((c) => c.categoryId === form.categoryId)?.categoryName ??
    "";

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

  const lineInput = (field: keyof FieldErrors) =>
    `${profilePaper.input} ${fieldErrors[field] ? styles.inputError : ""}`;

  return (
    <div className={shell.workspace}>
      <div className={shell.layout}>
        <aside className={shell.rail}>
          <h1 className={shell.railTitle}>Soạn tin.</h1>
          <p className={shell.railLead}>
            Nhập thông tin tin — bước tiếp theo chọn quảng bá và thanh toán từ
            ví.
          </p>

          <ol className={styles.steps}>
            <li className={`${styles.step} ${styles.stepActive}`}>
              <span className={styles.stepNum}>1</span>
              <span>Soạn nội dung tin nháp</span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <span>Quảng bá &amp; thanh toán ví</span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <span>Gửi duyệt &amp; đăng tin</span>
            </li>
          </ol>

          <Link
            href="/cong-ty/tin-tuyen-dung"
            className={styles.backLink}
          >
            ← Quản lý tin tuyển dụng
          </Link>
        </aside>

        <div className={shell.stack}>
          <div className={shell.tabRow} aria-hidden>
            <span className={`${shell.tab} ${shell.tabActive}`}>Soạn tin</span>
            <span className={`${shell.tab} ${styles.tabUpcoming}`}>
              Thanh toán
            </span>
            <span className={`${shell.tab} ${styles.tabUpcoming}`}>Duyệt</span>
          </div>

          <div className={shell.folder}>
            <div className={shell.paper}>
              <div className={shell.paperHead}>
                <h2 className={shell.paperTitle}>Tạo tin tuyển dụng</h2>
                <p className={shell.paperSub}>
                  Điền đủ các mục bắt buộc (*) — lưu nháp rồi chuyển sang bước
                  thanh toán.
                </p>
                {form.title.trim() ? (
                  <p className={styles.previewLine}>{form.title.trim()}</p>
                ) : null}
              </div>

              <section className={styles.formSection} aria-labelledby="jc-main">
                <h3 id="jc-main" className={profilePaper.sectionLabel}>
                  Thông tin chính
                </h3>
                <div className={profilePaper.fieldGrid}>
                  <div className={profilePaper.field}>
                    <label className={profilePaper.fieldLabel} htmlFor="title">
                      Tiêu đề công việc *
                    </label>
                    <input
                      id="title"
                      className={lineInput("title")}
                      value={form.title}
                      onChange={(e) => {
                        setForm({ ...form, title: e.target.value });
                        if (fieldErrors.title)
                          setFieldErrors({ ...fieldErrors, title: undefined });
                      }}
                    />
                    {fieldErrors.title ? (
                      <p className={styles.fieldError}>{fieldErrors.title}</p>
                    ) : null}
                  </div>
                  <div className={profilePaper.fieldGridTwo}>
                    <div className={profilePaper.field}>
                      <label
                        className={profilePaper.fieldLabel}
                        htmlFor="categoryId"
                      >
                        Danh mục *
                      </label>
                      <select
                        id="categoryId"
                        className={`${styles.selectInput} ${fieldErrors.categoryId ? styles.inputError : ""}`}
                        value={form.categoryId}
                        onChange={(e) => {
                          setForm({ ...form, categoryId: e.target.value });
                          if (fieldErrors.categoryId)
                            setFieldErrors({
                              ...fieldErrors,
                              categoryId: undefined,
                            });
                        }}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories?.map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>
                            {c.categoryName}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.categoryId ? (
                        <p className={styles.fieldError}>
                          {fieldErrors.categoryId}
                        </p>
                      ) : null}
                    </div>
                    <div className={profilePaper.field}>
                      <label className={profilePaper.fieldLabel} htmlFor="jobType">
                        Loại tin
                      </label>
                      <select
                        id="jobType"
                        className={styles.selectInput}
                        value={form.jobType}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            jobType: e.target.value as "NORMAL" | "VIP",
                          })
                        }
                      >
                        <option value="NORMAL">Tin thường</option>
                        <option value="VIP">Tin VIP (luôn tính phí đăng)</option>
                      </select>
                    </div>
                  </div>
                  <div className={profilePaper.field}>
                    <label className={profilePaper.fieldLabel} htmlFor="location">
                      Địa điểm làm việc *
                    </label>
                    <input
                      id="location"
                      className={lineInput("location")}
                      value={form.location}
                      onChange={(e) => {
                        setForm({ ...form, location: e.target.value });
                        if (fieldErrors.location)
                          setFieldErrors({
                            ...fieldErrors,
                            location: undefined,
                          });
                      }}
                    />
                    {fieldErrors.location ? (
                      <p className={styles.fieldError}>{fieldErrors.location}</p>
                    ) : null}
                  </div>
                  {categoryName ? (
                    <p className={profilePaper.hint}>Ngành: {categoryName}</p>
                  ) : null}
                </div>
              </section>

              <section className={styles.formSection} aria-labelledby="jc-salary">
                <h3 id="jc-salary" className={profilePaper.sectionLabel}>
                  Lương
                </h3>
                <label className={styles.checkRow}>
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
                  Lương thỏa thuận (không hiển thị khoảng cụ thể)
                </label>
                <p className={profilePaper.hint}>
                  Hoặc nhập khoảng có dấu phẩy (vd. 15,000,000 – 25,000,000
                  VND/tháng).
                </p>
                <div className={styles.salaryGrid}>
                  <div className={profilePaper.field}>
                    <label className={profilePaper.fieldLabel}>Lương tối thiểu</label>
                    <MoneyInput
                      digits={form.salaryMin}
                      placeholder="0"
                      disabled={form.salaryNegotiable}
                      className={lineInput("salaryMin")}
                      onDigitsChange={(digits) => {
                        setForm({
                          ...form,
                          salaryMin: digits,
                          salaryNegotiable: false,
                        });
                        if (fieldErrors.salaryMin)
                          setFieldErrors({
                            ...fieldErrors,
                            salaryMin: undefined,
                          });
                      }}
                    />
                    {fieldErrors.salaryMin ? (
                      <p className={styles.fieldError}>{fieldErrors.salaryMin}</p>
                    ) : null}
                  </div>
                  <div className={profilePaper.field}>
                    <label className={profilePaper.fieldLabel}>Lương tối đa</label>
                    <MoneyInput
                      digits={form.salaryMax}
                      placeholder="0"
                      disabled={form.salaryNegotiable}
                      className={lineInput("salaryMax")}
                      onDigitsChange={(digits) => {
                        setForm({
                          ...form,
                          salaryMax: digits,
                          salaryNegotiable: false,
                        });
                        if (fieldErrors.salaryMax)
                          setFieldErrors({
                            ...fieldErrors,
                            salaryMax: undefined,
                          });
                      }}
                    />
                    {fieldErrors.salaryMax ? (
                      <p className={styles.fieldError}>{fieldErrors.salaryMax}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className={styles.formSection} aria-labelledby="jc-body">
                <h3 id="jc-body" className={profilePaper.sectionLabel}>
                  Nội dung tin
                </h3>
                <div className={profilePaper.fieldGrid}>
                  <div className={profilePaper.field}>
                    <label className={profilePaper.fieldLabel} htmlFor="description">
                      Mô tả công việc *
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      className={`${profilePaper.textarea} ${fieldErrors.description ? styles.inputError : ""}`}
                      value={form.description}
                      onChange={(e) => {
                        setForm({ ...form, description: e.target.value });
                        if (fieldErrors.description)
                          setFieldErrors({
                            ...fieldErrors,
                            description: undefined,
                          });
                      }}
                    />
                    {fieldErrors.description ? (
                      <p className={styles.fieldError}>
                        {fieldErrors.description}
                      </p>
                    ) : null}
                  </div>
                  <div className={profilePaper.field}>
                    <label
                      className={profilePaper.fieldLabel}
                      htmlFor="requirements"
                    >
                      Yêu cầu ứng viên *
                    </label>
                    <textarea
                      id="requirements"
                      rows={4}
                      className={`${profilePaper.textarea} ${fieldErrors.requirements ? styles.inputError : ""}`}
                      value={form.requirements}
                      onChange={(e) => {
                        setForm({ ...form, requirements: e.target.value });
                        if (fieldErrors.requirements)
                          setFieldErrors({
                            ...fieldErrors,
                            requirements: undefined,
                          });
                      }}
                    />
                    {fieldErrors.requirements ? (
                      <p className={styles.fieldError}>
                        {fieldErrors.requirements}
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              <button
                type="button"
                disabled={save.isPending}
                onClick={handleContinue}
                className={styles.submitBtn}
              >
                {save.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Tiếp tục — thanh toán &amp; gửi duyệt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
