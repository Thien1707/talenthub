"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { uploadMedia } from "@/lib/api/upload";
import styles from "./company-profile-form.module.css";

type CompanyProfile = {
  companyName: string;
  taxCode?: string | null;
  industry?: string | null;
  companySize?: string | null;
  website?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  postingQuota?: {
    freePostLimit: number;
    freePostUsed: number;
    paidPostCount: number;
  } | null;
  logoAsset?: { secureUrl: string } | null;
};

function previewLine(parts: (string | undefined | null)[]) {
  return parts.filter((p) => p && String(p).trim()).join(" · ");
}

export function CompanyProfileForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["company", "profile"],
    queryFn: async () => {
      const { data } = await api.get<CompanyProfile>("/companies/me/profile");
      return data;
    },
  });

  const [logoAssetId, setLogoAssetId] = useState<string | undefined>();
  const [form, setForm] = useState({
    companyName: "",
    taxCode: "",
    industry: "",
    companySize: "",
    website: "",
    description: "",
    address: "",
    city: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        companyName: data.companyName ?? "",
        taxCode: data.taxCode ?? "",
        industry: data.industry ?? "",
        companySize: data.companySize ?? "",
        website: data.website ?? "",
        description: data.description ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
      });
    }
  }, [data]);

  const uploadLogo = useMutation({
    mutationFn: (file: File) => uploadMedia(file, "COMPANY_LOGO"),
    onSuccess: (asset) => {
      setLogoAssetId(asset.assetId);
      toast.success("Đã tải logo — bấm Lưu hồ sơ để áp dụng");
    },
    onError: () => toast.error("Upload logo thất bại (Cloudinary?)"),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.patch("/companies/me/profile", {
        ...form,
        ...(logoAssetId ? { logoAssetId } : {}),
      }),
    onSuccess: () => {
      toast.success("Đã lưu hồ sơ công ty");
      void qc.invalidateQueries({ queryKey: ["company", "profile"] });
    },
    onError: () => toast.error("Lưu thất bại"),
  });

  if (isLoading) {
    return <p className={styles.loading}>Đang tải hồ sơ…</p>;
  }

  const logoUrl = data?.logoAsset?.secureUrl;
  const metaLine = previewLine([
    form.website?.trim() || undefined,
    form.city?.trim() || undefined,
    form.address?.trim() || undefined,
  ]);

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <p className={styles.heroEyebrow}>TalentHub · Nhà tuyển dụng</p>
        <h1 className={styles.heroTitle}>
          Hồ sơ{" "}
          <span className={styles.heroAccent}>doanh nghiệp</span>
        </h1>
        <p className={styles.heroLead}>
          Thông tin công ty hiển thị trên{" "}
          <span className={styles.heroAccent}>tin tuyển dụng</span> — chỉnh trực
          tiếp trên tờ hồ sơ bên dưới.
        </p>
      </header>

      <div className={styles.desk}>
        <div className={styles.sheet}>
          <span className={styles.sheetDim} aria-hidden>
            A4 · 210×297
          </span>

          <div className={styles.docHeader}>
            <div className={styles.logoWrap}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className={styles.logoImg}
                />
              ) : (
                <div className={styles.logoPlaceholder}>Logo</div>
              )}
            </div>
            <h2 className={styles.docName}>
              {form.companyName.trim() || "Tên công ty"}
            </h2>
            <p className={styles.docSub}>
              {previewLine([
                form.industry?.trim(),
                form.companySize?.trim(),
              ]) || "Lĩnh vực · Quy mô"}
            </p>
            {metaLine ? (
              <p className={styles.docMeta}>{metaLine}</p>
            ) : (
              <p className={styles.docMeta}>Website · Địa điểm</p>
            )}
          </div>

          {data?.postingQuota ? (
            <p className={styles.quotaStrip}>
              Đăng tin miễn phí {data.postingQuota.freePostUsed}/
              {data.postingQuota.freePostLimit} · Tin trả phí đã dùng{" "}
              {data.postingQuota.paidPostCount}
            </p>
          ) : null}

          <section className={styles.section} aria-labelledby="cp-logo">
            <h3 id="cp-logo" className={styles.sectionLabel}>
              Logo
            </h3>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo.mutate(f);
              }}
            />
            {uploadLogo.isPending ? (
              <p className={styles.hint}>
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                Đang tải logo…
              </p>
            ) : (
              <p className={styles.hint}>PNG hoặc JPG, vuông, tối đa ~2MB.</p>
            )}
          </section>

          <section className={styles.section} aria-labelledby="cp-info">
            <h3 id="cp-info" className={styles.sectionLabel}>
              Thông tin chung
            </h3>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="companyName">
                  Tên công ty
                </label>
                <input
                  id="companyName"
                  className={styles.input}
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                />
              </div>
              <div className={styles.fieldGridTwo}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="taxCode">
                    Mã số thuế
                  </label>
                  <input
                    id="taxCode"
                    className={styles.input}
                    value={form.taxCode}
                    onChange={(e) =>
                      setForm({ ...form, taxCode: e.target.value })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="industry">
                    Lĩnh vực
                  </label>
                  <input
                    id="industry"
                    className={styles.input}
                    value={form.industry}
                    onChange={(e) =>
                      setForm({ ...form, industry: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={styles.fieldGridTwo}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="companySize">
                    Quy mô
                  </label>
                  <input
                    id="companySize"
                    className={styles.input}
                    value={form.companySize}
                    onChange={(e) =>
                      setForm({ ...form, companySize: e.target.value })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="website">
                    Website
                  </label>
                  <input
                    id="website"
                    className={styles.input}
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={styles.fieldGridTwo}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="city">
                    Tỉnh / Thành
                  </label>
                  <input
                    id="city"
                    className={styles.input}
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="address">
                    Địa chỉ
                  </label>
                  <input
                    id="address"
                    className={styles.input}
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="cp-about">
            <h3 id="cp-about" className={styles.sectionLabel}>
              Giới thiệu
            </h3>
            <div className={styles.field}>
              <label className="sr-only" htmlFor="description">
                Giới thiệu công ty
              </label>
              <textarea
                id="description"
                rows={5}
                className={styles.textarea}
                placeholder="Mô tả ngắn về công ty, văn hóa, sản phẩm…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </section>

          <div className={styles.actions}>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className={styles.saveBtn}
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Lưu hồ sơ
            </button>
            <span className={styles.hint}>
              Nội dung lưu sẽ hiển thị trên trang tin và hồ sơ công ty công khai.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
