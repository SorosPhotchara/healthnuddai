"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import styles from "./notifications.module.css";

type NotificationType = "appointment" | "queue" | "system" | "booking" | "reminder" | "cancel";

type Notification = {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  related_ap_id?: number;
};

const TYPE_ICON: Record<NotificationType, string> = {
  appointment: "📅",
  queue: "🔢",
  system: "⚙️",
  booking: "✅",
  reminder: "⏰",
  cancel: "❌",
};

// แปลงเวลาเป็นข้อความ "...ที่แล้ว"
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH");
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading, load_user } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);



  // ดึงข้อมูลแจ้งเตือนจาก API
  const fetchNotifications = useCallback(async () => {
    if (!user?.identification_number) return;

    try {
      const res = await fetch(`/api/notifications?user_id=${user.identification_number}`);
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.identification_number]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      fetchNotifications();
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    load_user();
  }, [load_user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchNotifications();
    }
  }, [isLoading, user, router, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  // อัปเดตเป็นอ่านทั้งหมด
  const markAllRead = async () => {
    if (!user?.identification_number) return;

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.identification_number,
          mark_all: true,
        }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  // อัปเดตเป็นอ่านทีละรายการ
  const markRead = async (id: number) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ textAlign: "center", padding: "2rem" }}>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>การแจ้งเตือน</h1>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount} ใหม่</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className={styles.markAllBtn}>
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${filter === "all" ? styles.tabActive : ""}`}
            onClick={() => setFilter("all")}
          >
            ทั้งหมด ({notifications.length})
          </button>
          <button
            className={`${styles.tab} ${filter === "unread" ? styles.tabActive : ""}`}
            onClick={() => setFilter("unread")}
          >
            ยังไม่ได้อ่าน ({unreadCount})
          </button>
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔔</span>
            <p>ไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {filtered.map((n) => (
              <li
                key={n.id}
                className={`${styles.item} ${!n.is_read ? styles.itemUnread : ""}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className={styles.itemIcon}>{TYPE_ICON[n.type] || "🔔"}</div>
                <div className={styles.itemBody}>
                  <div className={styles.itemTop}>
                    <span className={`${styles.itemTitle} ${!n.is_read ? styles.itemTitleUnread : ""}`}>
                      {n.title}
                    </span>
                    <span className={styles.itemTime}>{formatTimeAgo(n.created_at)}</span>
                  </div>
                  <p className={styles.itemMessage}>{n.message}</p>
                </div>
                {!n.is_read && <span className={styles.dot} />}
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}