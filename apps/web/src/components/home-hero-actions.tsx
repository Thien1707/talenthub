"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import styles from "./home-hero-actions.module.css";

export function HomeHeroActions() {
  const { user, loading } = useAuth();

  const postJobHref =
    !loading && user?.role === "COMPANY"
      ? "/cong-ty/tin-tuyen-dung"
      : "/dang-ky?role=company";

  const postJobLabel =
    !loading && user?.role === "COMPANY"
      ? "Quản lý tin tuyển dụng"
      : "Đăng tin tuyển dụng";

  const findJobsHref =
    !loading && user?.role === "STUDENT" ? "/viec-lam" : "/viec-lam";

  return (
    <div className={styles.actions}>
      <Link href={findJobsHref} className="button button-primary button-hero">
        <Search className="h-4 w-4" />
        Tìm việc ngay
      </Link>
      <Link href={postJobHref} className="button button-secondary button-hero">
        {postJobLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
