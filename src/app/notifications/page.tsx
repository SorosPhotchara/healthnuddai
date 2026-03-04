"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./notifications.module.css";

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "appointment" | "queue" | "system";
  queueNumber?: number;
  currentQueue?: number;
};

const TYPE_ICON: Record<Notification["type"], string> = {
  appointment: "📅",
  queue: "🔢",
  system: "⚙️",
};

export default function NotificationsPage() {
  const [notifications, set_notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, set_filter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const mark_all_read = () => {
    set_notifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const mark_read = (id: number) => {
    set_notifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

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
            <button onClick={mark_all_read} className={styles.markAllBtn}>
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${filter === "all" ? styles.tabActive : ""}`}
            onClick={() => set_filter("all")}
          >
            ทั้งหมด ({notifications.length})
          </button>
          <button
            className={`${styles.tab} ${filter === "unread" ? styles.tabActive : ""}`}
            onClick={() => set_filter("unread")}
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
                className={`${styles.item} ${!n.read ? styles.itemUnread : ""}`}
                onClick={() => mark_read(n.id)}
              >
                <div className={styles.itemIcon}>{TYPE_ICON[n.type]}</div>
                <div className={styles.itemBody}>
                  <div className={styles.itemTop}>
                    <span className={`${styles.itemTitle} ${!n.read ? styles.itemTitleUnread : ""}`}>
                      {n.title}
                    </span>
                    <span className={styles.itemTime}>{n.time}</span>
                  </div>
                  <p className={styles.itemMessage}>{n.message}</p>
                </div>
                {!n.read && <span className={styles.dot} />}
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}