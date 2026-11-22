"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LocationFields } from "@/components/locations/location-fields";
import { MoneyInput } from "@/components/ui/money-input";
import { api } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/extract-api-error";
import { formatVND, parseVndAmount } from "@/lib/format-money";
import profilePaper from "./company-profile-form.module.css";
import styles from "./job-create-form.module.css";

type Category = { categoryId: string; categoryName: string };
type EditableJob = {
  jobId: string;
  title: string;
  categoryId: string;
  description: string;
  requirements: string;
  location: string;
  province: string | null;
  ward: string | null;
  streetAddress: string | null;
  workScheduleType: "FULL_TIME" | "PART_TIME" | null;
  schedules: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    shiftName: string | null;
  }[];
  salaryMin: string | number | null;
  salaryMax: string | number | null;
  jobType: "NORMAL" | "VIP";
};
type ScheduleRow = {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  days: string[];
};

const WORK_DAYS = [
  ["MONDAY", "Thứ 2"],
  ["TUESDAY", "Thứ 3"],
  ["WEDNESDAY", "Thứ 4"],
  ["THURSDAY", "Thứ 5"],
  ["FRIDAY", "Thứ 6"],
  ["SATURDAY", "Thứ 7"],
  ["SUNDAY", "Chủ nhật"],
] as const;

const MAX_SALARY_VND = 999_999_999_999;

type FieldErrors = Partial<
  Record<
    | "title"
    | "categoryId"
    | "description"
    | "requirements"
    | "location"
    | "streetAddress"
    | "salaryMin"
    | "salaryMax"
    | "schedules",
    string
  >
>;

export function JobCreateForm({ jobId }: { jobId?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    requirements: "",
    location: "",
    province: "",
    ward: "",
    streetAddress: "",
    salaryMin: "",
    salaryMax: "",
    salaryNegotiable: false,
    jobType: "NORMAL" as "NORMAL" | "VIP",
    workScheduleType: "FULL_TIME" as "FULL_TIME" | "PART_TIME",
  });
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([
    {
      id: 1,
      shiftName: "",
      startTime: "09:00",
      endTime: "18:00",
      days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    },
  ]);
  const [nextScheduleId, setNextScheduleId] = useState(2);

  const {
    data: existingJob,
    isPending: jobLoading,
    isError: jobError,
  } = useQuery({
    queryKey: ["jobs", "company", jobId],
    queryFn: async () => {
      const { data } = await api.get<EditableJob>(
        `/jobs/company/mine/${jobId}`,
      );
      return data;
    },
    enabled: Boolean(jobId),
  });

  useEffect(() => {
    if (!existingJob) return;
    setForm({
      title: existingJob.title,
      categoryId: existingJob.categoryId,
      description: existingJob.description,
      requirements: existingJob.requirements,
      location: existingJob.location,
      province: existingJob.province ?? "",
      ward: existingJob.ward ?? "",
      streetAddress: existingJob.streetAddress ?? "",
      salaryMin:
        parseVndAmount(existingJob.salaryMin) === null
          ? ""
          : String(parseVndAmount(existingJob.salaryMin)),
      salaryMax:
        parseVndAmount(existingJob.salaryMax) === null
          ? ""
          : String(parseVndAmount(existingJob.salaryMax)),
      salaryNegotiable:
        existingJob.salaryMin == null && existingJob.salaryMax == null,
      jobType: existingJob.jobType,
      workScheduleType: existingJob.workScheduleType ?? "FULL_TIME",
    });

    const groups = new Map<string, ScheduleRow>();
    for (const schedule of existingJob.schedules) {
      const key = `${schedule.shiftName ?? ""}|${schedule.startTime}|${schedule.endTime}`;
      const row = groups.get(key);
      if (row) {
        row.days.push(schedule.dayOfWeek);
      } else {
        groups.set(key, {
          id: groups.size + 1,
          shiftName: schedule.shiftName ?? "",
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          days: [schedule.dayOfWeek],
        });
      }
    }
    const rows = [...groups.values()];
    setScheduleRows(rows);
    setNextScheduleId(rows.length + 1);
  }, [existingJob]);

  const {
    data: categories,
    isPending: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
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
    if (!form.province) err.location = "Chọn tỉnh/thành phố.";
    if (!form.streetAddress.trim())
      err.streetAddress = "Nhập số nhà và tên đường.";
    if (
      scheduleRows.length === 0 ||
      scheduleRows.some(
        (row) =>
          !row.startTime ||
          !row.endTime ||
          row.startTime >= row.endTime ||
          row.days.length === 0,
      )
    ) {
      err.schedules = "Mỗi ca cần giờ hợp lệ và ít nhất một ngày làm việc.";
    }
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
        location: [form.streetAddress.trim(), form.ward, form.province]
          .filter(Boolean)
          .join(", "),
        province: form.province,
        ward: form.ward || undefined,
        streetAddress: form.streetAddress.trim(),
        detailAddress: [form.streetAddress.trim(), form.ward, form.province]
          .filter(Boolean)
          .join(", "),
        workScheduleType: form.workScheduleType,
        schedules: scheduleRows.flatMap((row) =>
          row.days.map((dayOfWeek) => ({
            dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            shiftName: row.shiftName.trim() || undefined,
          })),
        ),
        jobType: form.jobType,
        salaryMin:
          !form.salaryNegotiable && form.salaryMin.trim()
            ? parseVndAmount(form.salaryMin) ?? undefined
            : undefined,
        salaryMax:
          !form.salaryNegotiable && form.salaryMax.trim()
            ? parseVndAmount(form.salaryMax) ?? undefined
            : undefined,
      };
      if (jobId) {
        await api.patch(`/jobs/company/${jobId}`, {
          ...payload,
          salaryMin: form.salaryNegotiable
            ? null
            : parseVndAmount(form.salaryMin),
          salaryMax: form.salaryNegotiable
            ? null
            : parseVndAmount(form.salaryMax),
        });
        return { jobId, editing: true };
      }
      const { data } = await api.post<{ jobId: string }>(
        "/jobs/company",
        payload,
      );
      return { ...data, editing: false };
    },
    onSuccess: (data) => {
      if (data.editing) {
        toast.success("Đã cập nhật tin nháp");
        void qc.invalidateQueries({ queryKey: ["jobs", "company"] });
        router.push("/cong-ty/tin-tuyen-dung");
        return;
      }
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

  if (jobId && jobLoading) {
    return <p className={styles.loading}>Đang tải tin nháp…</p>;
  }

  if (jobId && (jobError || !existingJob)) {
    return (
      <div className={styles.workspace}>
        <p role="alert" className={styles.fieldError}>
          Không tải được tin nháp để chỉnh sửa.
        </p>
        <Link href="/cong-ty/tin-tuyen-dung" className={styles.backLink}>
          ← Quản lý tin tuyển dụng
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.layout}>
        <aside className={styles.rail}>
          <h1>{jobId ? "Chỉnh sửa tin." : "Soạn tin."}</h1>
          <p>
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

        <div>
          <div className={styles.tabRow} aria-hidden>
            <span>Soạn tin</span>
            <span className={styles.tabUpcoming}>
              Thanh toán
            </span>
            <span className={styles.tabUpcoming}>Duyệt</span>
          </div>

          <div className={styles.folder}>
            <div className={styles.paper}>
              <div className={styles.paperHead}>
                <h2 className={styles.paperTitle}>
                  {jobId ? "Chỉnh sửa tin tuyển dụng" : "Tạo tin tuyển dụng"}
                </h2>
                <p className={styles.paperSub}>
                  {jobId
                    ? "Cập nhật nội dung tin nháp trước khi gửi duyệt."
                    : "Điền đủ các mục bắt buộc (*) — lưu nháp rồi chuyển sang bước thanh toán."}
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
                        disabled={categoriesLoading || categoriesError}
                        onChange={(e) => {
                          setForm({ ...form, categoryId: e.target.value });
                          if (fieldErrors.categoryId)
                            setFieldErrors({
                              ...fieldErrors,
                              categoryId: undefined,
                            });
                        }}
                      >
                        <option value="">
                          {categoriesLoading
                            ? "Đang tải danh mục..."
                            : "Chọn danh mục"}
                        </option>
                        {categories?.map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>
                            {c.categoryName}
                          </option>
                        ))}
                      </select>
                      {categoriesError ? (
                        <p role="alert" className={styles.fieldError}>
                          Không tải được danh mục. Vui lòng kiểm tra API.
                        </p>
                      ) : null}
                      {!categoriesLoading &&
                      !categoriesError &&
                      (categories?.length ?? 0) === 0 ? (
                        <p role="alert" className={styles.fieldError}>
                          Chưa có danh mục nghề nghiệp. Tại thư mục gốc dự án,
                          chạy{" "}
                          <code>npm run db:seed:categories</code> rồi tải lại
                          trang.
                        </p>
                      ) : null}
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
                  <LocationFields
                    province={form.province}
                    ward={form.ward}
                    required
                    className={profilePaper.fieldGridTwo}
                    onChange={(location) => {
                      setForm({ ...form, ...location });
                      if (fieldErrors.location) {
                        setFieldErrors({ ...fieldErrors, location: undefined });
                      }
                    }}
                  />
                  <div className={profilePaper.field}>
                    <label
                      className={profilePaper.fieldLabel}
                      htmlFor="streetAddress"
                    >
                      Số nhà, tên đường *
                    </label>
                    <input
                      id="streetAddress"
                      className={lineInput("streetAddress")}
                      value={form.streetAddress}
                      onChange={(e) => {
                        setForm({ ...form, streetAddress: e.target.value });
                        if (fieldErrors.streetAddress)
                          setFieldErrors({
                            ...fieldErrors,
                            streetAddress: undefined,
                          });
                      }}
                      required
                    />
                    {fieldErrors.streetAddress ? (
                      <p className={styles.fieldError}>
                        {fieldErrors.streetAddress}
                      </p>
                    ) : null}
                    {fieldErrors.location ? (
                      <p className={styles.fieldError}>{fieldErrors.location}</p>
                    ) : null}
                  </div>
                  {categoryName ? (
                    <p className={profilePaper.hint}>Ngành: {categoryName}</p>
                  ) : null}
                </div>
              </section>

              <section className={styles.formSection} aria-labelledby="jc-work">
                <h3 id="jc-work" className={profilePaper.sectionLabel}>
                  Thời gian làm việc
                </h3>
                <div className={profilePaper.field}>
                  <label
                    className={profilePaper.fieldLabel}
                    htmlFor="workScheduleType"
                  >
                    Loại hình tuyển dụng
                  </label>
                  <select
                    id="workScheduleType"
                    className={styles.selectInput}
                    value={form.workScheduleType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        workScheduleType: event.target.value as
                          | "FULL_TIME"
                          | "PART_TIME",
                      })
                    }
                  >
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                  </select>
                </div>
                <p className={profilePaper.hint}>
                  {form.workScheduleType === "PART_TIME"
                    ? "Thêm từng ca và chọn các ngày trong tuần cần tuyển."
                    : "Khai báo giờ và ngày làm việc full-time. Bạn có thể giữ nhiều ca nếu cần."}
                </p>
                <div className={styles.scheduleList}>
                  {scheduleRows.map((row, index) => (
                    <fieldset className={styles.scheduleCard} key={row.id}>
                      <legend className={styles.scheduleLegend}>
                        {form.workScheduleType === "PART_TIME"
                          ? `Ca ${index + 1}`
                          : `Lịch ${index + 1}`}
                      </legend>
                      <div className={styles.scheduleFields}>
                        <label className={profilePaper.field}>
                          <span className={profilePaper.fieldLabel}>
                            Tên ca (không bắt buộc)
                          </span>
                          <input
                            className={profilePaper.input}
                            value={row.shiftName}
                            placeholder={
                              form.workScheduleType === "PART_TIME"
                                ? "Ca sáng"
                                : "Giờ hành chính"
                            }
                            onChange={(event) =>
                              setScheduleRows((rows) =>
                                rows.map((item) =>
                                  item.id === row.id
                                    ? { ...item, shiftName: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className={profilePaper.field}>
                          <span className={profilePaper.fieldLabel}>
                            Bắt đầu
                          </span>
                          <input
                            className={profilePaper.input}
                            type="time"
                            value={row.startTime}
                            onChange={(event) =>
                              setScheduleRows((rows) =>
                                rows.map((item) =>
                                  item.id === row.id
                                    ? { ...item, startTime: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            required
                          />
                        </label>
                        <label className={profilePaper.field}>
                          <span className={profilePaper.fieldLabel}>
                            Kết thúc
                          </span>
                          <input
                            className={profilePaper.input}
                            type="time"
                            value={row.endTime}
                            onChange={(event) =>
                              setScheduleRows((rows) =>
                                rows.map((item) =>
                                  item.id === row.id
                                    ? { ...item, endTime: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            required
                          />
                        </label>
                      </div>
                      <div className={styles.dayChoices}>
                        {WORK_DAYS.map(([value, label]) => (
                          <label className={styles.dayChoice} key={value}>
                            <input
                              type="checkbox"
                              checked={row.days.includes(value)}
                              onChange={(event) =>
                                setScheduleRows((rows) =>
                                  rows.map((item) =>
                                    item.id === row.id
                                      ? {
                                          ...item,
                                          days: event.target.checked
                                            ? [...item.days, value]
                                            : item.days.filter(
                                                (day) => day !== value,
                                              ),
                                        }
                                      : item,
                                  ),
                                )
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      {scheduleRows.length > 1 ? (
                        <button
                          type="button"
                          className={styles.removeSchedule}
                          onClick={() =>
                            setScheduleRows((rows) =>
                              rows.filter((item) => item.id !== row.id),
                            )
                          }
                        >
                          Xóa lịch này
                        </button>
                      ) : null}
                    </fieldset>
                  ))}
                </div>
                {fieldErrors.schedules ? (
                  <p className={styles.fieldError}>{fieldErrors.schedules}</p>
                ) : null}
                <button
                  type="button"
                  className={styles.addSchedule}
                  onClick={() => {
                    setScheduleRows((rows) => [
                      ...rows,
                      {
                        id: nextScheduleId,
                        shiftName: "",
                        startTime: "13:00",
                        endTime: "18:00",
                        days: [],
                      },
                    ]);
                    setNextScheduleId((id) => id + 1);
                  }}
                >
                  + Thêm {form.workScheduleType === "PART_TIME" ? "ca" : "lịch"}
                </button>
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
                {jobId
                  ? "Lưu thay đổi"
                  : "Tiếp tục — thanh toán & gửi duyệt"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
