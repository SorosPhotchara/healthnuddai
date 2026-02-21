"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import styles from "./profile.module.css";

const DEPT_ICONS: { [key: number]: string } = {
  1: "💚",
  2: "🔬",
  3: "👶",
  4: "🎨",
  5: "🦴",
  6: "📋",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, load_user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (user?.identification_number) {
      try {
        const res = await fetch(`/api/booking?id_number=${user.identification_number}`);
        const data = await res.json();
        if (data.success) {
          setAppointments(data.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
  }, [user]);

  useEffect(() => {
    load_user();
  }, [load_user]);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user, fetchAppointments]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);


  const is_expired = (appointmentDate: string, appointmentTime: string) => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const apDateStr = appointmentDate.split('T')[0];

    if (apDateStr < todayStr) return true;

    if (apDateStr === todayStr) {
      const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();
      const [apHour] = appointmentTime.split(":").map(Number);
      const morningEnd = 9 * 60;
      const afternoonEnd = 13 * 60;

      if (apHour < 12 && currentTimeInMinutes > morningEnd) return true;
      if (apHour >= 12 && currentTimeInMinutes > afternoonEnd) return true;
    }
    return false;
  };


  useEffect(() => {
    const autoCancelExpired = async () => {
      const expiredApps = appointments.filter(ap =>
        (!ap.status || ap.status === "pending") && is_expired(ap.date, ap.time)
      );

      if (expiredApps.length === 0) return;

      for (const ap of expiredApps) {
        try {
          await fetch("/api/booking/auto_cancel", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ap_id: ap.ap_id }),
          });
        } catch (error) {
          console.error("Auto cancel failed:", error);
        }
      }
      fetchAppointments();
    };

    if (appointments.length > 0) autoCancelExpired();
  }, [appointments, fetchAppointments]);

  const can_confirm = (appointmentTime: string, appointmentDate: string) => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const apDateStr = appointmentDate.split('T')[0];
    if (todayStr !== apDateStr) return false;

    const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();

    const morningStart = 8 * 60;
    const morningEnd = 9 * 60;
    const afternoonStart = 12 * 60;
    const afternoonEnd = 13 * 60;

    const [apHour] = appointmentTime.split(":").map(Number);
    if (apHour < 12) {
      return currentTimeInMinutes >= morningStart && currentTimeInMinutes <= morningEnd;
    } else {
      return currentTimeInMinutes >= afternoonStart && currentTimeInMinutes <= afternoonEnd;
    }
  };

  const handle_status_update = async (ap_id: number, newStatus: string) => {
    if (newStatus === "cancel") {
      if (!window.confirm("คุณยืนยันที่จะยกเลิกนัดหมายนี้ใช่หรือไม่?")) return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/booking/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ap_id, status: newStatus }),
      });
      if (res.ok) {
        setAppointments(prev =>
          prev.map(ap => ap.ap_id === ap_id ? { ...ap, status: newStatus } : ap)
        );
        alert(newStatus === "done" ? "ยืนยันสำเร็จ! 🎉" : "ยกเลิกเรียบร้อย");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsActionLoading(false);
    }
  };

  const upcoming = appointments.filter(ap =>
    (!ap.status || ap.status === "pending") && !is_expired(ap.date, ap.time)
  );


  const history = appointments.filter(ap =>
    ap.status === "done" || ap.status === "cancel" || is_expired(ap.date, ap.time)
  );

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}><span className={styles.avatarIcon}>👤</span></div>
          <h1 className={styles.userName}>{user?.title || ""}{user?.fname} {user?.lname}</h1>
        </div>
        <button className={styles.editButton}>แก้ไขโปรไฟล์</button>
      </div>

      <div className={styles.appointmentSection}>
        <h2 className={styles.sectionTitle}>นัดที่กำลังจะมาถึง</h2>
        {upcoming.length > 0 ? (
          upcoming.map((ap) => {
            const isConfirmable = can_confirm(ap.time, ap.date);
            return (
              <div key={ap.ap_id} className={styles.upcomingCard}>
                <div className={styles.countdownBanner}>
                  {isConfirmable
                    ? "✨ ขณะนี้เปิดให้กดยืนยันการมาตามนัดแล้ว"
                    : "⌛ กรุณายืนยันนัดในวันที่นัดหมาย (เช้า 08:00-09:00 / บ่าย 12:00-13:00)"}
                </div>
                <div className={styles.appointmentInfo}>
                  <div className={styles.appointmentDate}>
                    <h3 className={styles.dateText}>{ap.date?.split('T')[0]}</h3>
                    <p className={styles.timeText}>เวลา {ap.time} น.</p>
                    <span className={styles.statusBadge}>รอยืนยัน</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <p>
                      <span className={styles.detailLabel}>แผนก:</span>
                      <span className={styles.deptHighlight}>
                        {DEPT_ICONS[ap.dno] || "🏥"} {ap.department_name || "แผนกทั่วไป"}
                      </span>
                    </p>
                    <p><span className={styles.detailLabel}>รหัสนัด:</span> {ap.ap_id}</p>
                  </div>
                </div>
                <div className={styles.appointmentActions}>
                  <button
                    className={styles.confirmButton}
                    onClick={() => handle_status_update(ap.ap_id, "done")}
                    disabled={!isConfirmable || isActionLoading}
                  >
                    ยืนยันนัด
                  </button>
                  <button className={styles.rescheduleButton} onClick={() => alert("ระบบเลื่อนนัดกำลังพัฒนา")}>เลื่อนนัด</button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => handle_status_update(ap.ap_id, "cancel")}
                    disabled={isActionLoading}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.noData}>ไม่มีรายการนัดหมายที่รอยืนยัน</div>
        )}
      </div>

      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>ประวัติการนัดหมาย</h2>
        <div className={styles.historyList}>
          {history.length > 0 ? history.map((item) => {
            return (
              <div key={item.ap_id} className={styles.historyCard}>
                <div className={styles.historyDate}>{item.date?.split('T')[0]}</div>
                <div className={styles.historyContent}>
                  <p>🕑 เวลา {item.time} น.</p>
                  <p>{DEPT_ICONS[item.dno] || "🏥"} แผนก {item.department_name || "ทั่วไป"} (รหัส: {item.ap_id})</p>
                </div>
                <span className={`${styles.historyStatus} ${item.status === 'done' ? styles.statusComplete : styles.statusCancel
                  }`}>
                  {item.status === 'done' ? "เสร็จสิ้น" : "ยกเลิก"}
                </span>
              </div>
            );
          }) : <p className={styles.noData}>ยังไม่มีประวัติการนัดหมาย</p>}
        </div>
      </div>

      <footer className={styles.footer}>
        <p>© 2026 Software Development | สุขภาพนัดได้</p>
        <p>Present by Group 3</p>
      </footer>
    </div>
  );
}