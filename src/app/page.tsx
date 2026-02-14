"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import styles from "./dashboard.module.css";
import Image from "next/image";

export default function Dashboard() {
  const { user, isLoading, load_user } = useAuthStore();

  useEffect(() => {
    load_user();
  }, [load_user]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <p className={styles.menuTitle}>เมนู</p>
          <nav className={styles.menuList}>
            <Link href="/" className={`${styles.menuItem} ${styles.menuItemActive}`}>
              <span className={styles.menuIcon}>🏠</span>
              หน้าหลัก
            </Link>
            <Link href="/appointments" className={styles.menuItem}>
              <span className={styles.menuIcon}>📅</span>
              นัดหมายของฉัน
            </Link>
            <Link href="/book" className={styles.menuItem}>
              <span className={styles.menuIcon}>➕</span>
              จองคิวใหม่
            </Link>
            <Link href="/profile" className={styles.menuItem}>
              <span className={styles.menuIcon}>👤</span>
              ข้อมูลของฉัน
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.welcomeCard}>
            <h1 className={styles.welcomeTitle}>
              {"จองคิวออนไลน์ ง่ายนิดเดียว"}
            </h1>

            <div className={styles.welcomeRow}>
              <p className={styles.welcomeSubtitle}>
                {"ไม่ต้องรอ ไม่ต้องเสียเวลา จองล่วงหน้าได้ที่บ้าน"}
              </p>

              <Link href="/book" className={styles.bookNowButton}>
                จองนัดเลย
              </Link>
            </div>
          </div>

          <div className={styles.promoSection}>
            <Image
              src="/news.png"
              alt="ประชาสัมพันธ์"
              width={1200}
              height={600}
              className={styles.promoImage}
            />
          </div>

          <div className={styles.statsGrid}>
            <Link href="/book" className={styles.statCard}>
              <div className={styles.statNumber}>📅</div>
              <div className={styles.statLabel}>จองนัดหมาย</div>
            </Link>

            <Link href="/book" className={styles.statCard}>
              <div className={styles.statNumber}>🗒️</div>
              <div className={styles.statLabel}>ตรวจสอบนัด</div>
            </Link>

            <Link href="/book" className={styles.statCard}>
              <div className={styles.statNumber}>⌛️</div>
              <div className={styles.statLabel}>คิวเรียลไทม์</div>
            </Link>
          </div>

          <div className={styles.appointmentsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>นัดหมายที่กำลังจะถึง</h2>
              <Link href="/appointments" className={styles.viewAllLink}>
                ดูทั้งหมด
              </Link>
            </div>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <p>ยังไม่มีนัดหมาย</p>
              <Link href="/book" className={styles.bookButton}>
                จองคิวเลย
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
