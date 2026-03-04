"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import styles from "./Navbar.module.css";

// หน้าที่ไม่ต้องแสดง Navbar
const HIDDEN_NAVBAR_PATHS = ["/login", "/register"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, load_user } = useAuthStore();
  const [isMenuOpen, set_is_menu_open] = useState(false);
  const [notifyOpen, set_notify_open] = useState(false);
  const [unreadCount, set_unread_count] = useState(2);

  useEffect(() => {
    load_user();
  }, [load_user]);

  // ไม่แสดง Navbar ในหน้า login และ register
  if (HIDDEN_NAVBAR_PATHS.includes(pathname)) {
    return null;
  }

  const handle_logout = () => {
    logout();
    router.push("/");
  };

  const NAV_ITEMS = [
    { href: "/", label: "หน้าหลัก" },
    { href: "/booking", label: "จองนัด" },
    { href: "/queue", label: "คิวเรียลไทม์" },
    { href: "/doctors", label: "แพทย์และแผนก" },
    { href: "/guide", label: "คู่มือ/วิธีใช้" },
  ];

const NotifyBell = () => (
  <div className={styles.notifyWrapper}>
    <button
      onClick={() => { set_notify_open(!notifyOpen); if (!notifyOpen) set_unread_count(0); }}
      className={styles.notifyButton}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className={styles.notifyBadge}>{unreadCount}</span>
      )}
    </button>
    {notifyOpen && (
      <>
        <div onClick={() => set_notify_open(false)} className={styles.notifyBackdrop} />
        <div className={styles.notifyDropdown}>
          <div className={styles.notifyHeader}>การแจ้งเตือน</div>
          <ul className={styles.notifyList}>
            {[
              { id: 1, title: "ยืนยันนัดหมาย", message: "นัดหมายของคุณได้รับการยืนยันแล้ว", time: "5 นาทีที่แล้ว", read: false },
              { id: 2, title: "แจ้งเตือนคิว", message: "คุณอยู่ในลำดับที่ 3 กรุณาเตรียมตัว", time: "20 นาทีที่แล้ว", read: false },
            ].map((n) => (
              <li key={n.id} className={`${styles.notifyItem} ${n.read ? styles.notifyItemRead : styles.notifyItemUnread}`}>
                <span className={`${styles.notifyDot} ${n.read ? styles.notifyDotRead : styles.notifyDotUnread}`} />
                <div>
                  <div className={`${styles.notifyTitle} ${n.read ? styles.notifyTitleRead : styles.notifyTitleUnread}`}>{n.title}</div>
                  <div className={styles.notifyMessage}>{n.message}</div>
                  <div className={styles.notifyTime}>{n.time}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.notifyFooter}>
            <Link href="/notifications" className={styles.notifyFooterLink} onClick={() => set_notify_open(false)}>ดูทั้งหมด</Link>
          </div>
        </div>
      </>
    )}
  </div>
);
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        สุขภาพนัดได้
      </Link>
      <div className={styles.navLinks}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className={styles.authButtons}>
        {user ? (
          <>
            <NotifyBell /> 
            <Link href="/profile" className={styles.userName}> 
              {user.fname} {user.lname}
            </Link>
            <button onClick={handle_logout} className={styles.logoutButton}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <Link href="/login" className={styles.loginButton}>
            เข้าสู่ระบบ
          </Link>
        )}
      </div>

      <button
        className={styles.menuButton}
        onClick={() => set_is_menu_open(!isMenuOpen)}
      >
        <div className={styles.menuIcon}>
          <span className={styles.menuIconLine}></span>
          <span className={styles.menuIconLine}></span>
          <span className={styles.menuIconLine}></span>
        </div>
      </button>

      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
            onClick={() => set_is_menu_open(false)}
          >
            {item.label}
          </Link>
        ))}
        <div className={styles.authButtons}>
          <NotifyBell /> 
          {user ? (
            <>
              <Link href="/profile" className={styles.userName}>
                {user.fname} {user.lname}
              </Link>
              <button onClick={handle_logout} className={styles.logoutButton}>
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
