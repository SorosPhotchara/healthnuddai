"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, load_user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);


  useEffect(() => {
    load_user();
  }, [load_user]);


  useEffect(() => {
    const fetchAppointments = async () => {
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
    };
    if (user) fetchAppointments();
  }, [user]);


  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);


  const can_confirm = (appointmentTime: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const [hour] = appointmentTime.split(":").map(Number);

    if (hour < 12) {

      return currentHour === 8;
    } else {

      return currentHour === 12;
    }
  };


  const handle_status_update = async (ap_id: number, newStatus: string) => {
    if (newStatus === "cancel") {
      const isConfirmed = window.confirm("คุณยืนยันที่จะยกเลิกนัดหมายนี้ใช่หรือไม่?");
      if (!isConfirmed) return;
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
        alert(newStatus === "done" ? "ยืนยันการมาตามนัดสำเร็จ! 🎉" : "ยกเลิกนัดเรียบร้อย");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsActionLoading(false);
    }
  };


  if (isLoading || !user) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>กำลังโหลด...</p>
      </div>
    );
  }


  const upcoming = appointments.filter(ap => !ap.status || ap.status === "pending");
  const history = appointments.filter(ap => ap.status === "done" || ap.status === "cancel");


  const format_birth_date = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const thaiYear = date.getFullYear() + 543;
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${date.getDate()} ${months[date.getMonth()]} ${thaiYear}`;
  };

  const calculate_age = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const format_id_number = (id: string | undefined) => {
    if (!id) return "-";
    return `${id.slice(0, 1)}-${id.slice(1, 5)}-${id.slice(5, 10)}-${id.slice(10, 12)}-${id.slice(12)}`;
  };

  const get_sex_label = (sex: string | undefined) => {
    if (sex === "M") return "ชาย";
    if (sex === "F") return "หญิง";
    return "-";
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}><span className={styles.avatarIcon}>👤</span></div>
          <h1 className={styles.userName}>{user.title || ""}{user.fname} {user.lname}</h1>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}><span className={styles.infoValue}>{user.email || "-"}</span></div>
          <div className={styles.infoItem}><span className={styles.infoValue}>{user.phone_number || "-"}</span></div>
          <div className={styles.infoItem}><span className={styles.infoValue}>{calculate_age(user.birth_date)} ปี ({format_birth_date(user.birth_date)})</span></div>
        </div>
        <div className={styles.infoRow}>
          <div className={styles.infoItem}><span className={styles.infoLabel}>เพศ</span><span className={styles.infoValue}>{get_sex_label(user.sex)}</span></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}>เลขบัตรประชาชน</span><span className={styles.infoValue}>{format_id_number(user.identification_number)}</span></div>
        </div>
        <button className={styles.editButton}>แก้ไขโปรไฟล์</button>
      </div>

      {/* นัด */}
      <div className={styles.appointmentSection}>
        <h2 className={styles.sectionTitle}>นัดที่กำลังจะมาถึง</h2>
        {upcoming.length > 0 ? (
          upcoming.map((ap) => (
            <div key={ap.ap_id} className={styles.upcomingCard}>
              <div className={styles.countdownBanner}>
                {can_confirm(ap.time)
                  ? "✨ ขณะนี้เปิดให้กดยืนยันการมาตามนัดแล้ว"
                  : "⌛ กรุณายืนยันนัดในเวลา (เช้า 08:00-09:00 / บ่าย 12:00-13:00)"}
              </div>
              <div className={styles.appointmentInfo}>
                <div className={styles.appointmentDate}>
                  <h3 className={styles.dateText}>{ap.date}</h3>
                  <p className={styles.timeText}>เวลา {ap.time} น.</p>
                  <span className={styles.statusBadge}>รอยืนยัน</span>
                </div>
                <div className={styles.appointmentDetails}>
                  <p><span className={styles.detailLabel}>แผนก:</span> {ap.department_id || "ตรวจสอบหน้าเคาน์เตอร์"}</p>
                  <p><span className={styles.detailLabel}>รหัสนัด:</span> {ap.ap_id}</p>
                  <p><span className={styles.detailLabel}>ชื่อ-นามสกุล:</span> {ap.fname} {ap.lname}</p>
                </div>
              </div>
              <div className={styles.appointmentActions}>
                <button
                  className={styles.confirmButton}
                  onClick={() => handle_status_update(ap.ap_id, "done")}
                  disabled={!can_confirm(ap.time) || isActionLoading}
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
          ))
        ) : (
          <div className={styles.noData}>ไม่มีรายการนัดหมายที่รอยืนยัน</div>
        )}
      </div>

      {/* ประวัติ */}
      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>ประวัติการนัดหมาย</h2>
        <div className={styles.historyList}>
          {history.length > 0 ? history.map((item) => (
            <div key={item.ap_id} className={styles.historyCard}>
              <div className={styles.historyDate}>{item.date}</div>
              <div className={styles.historyContent}>
                <p>🕑 เวลา {item.time} น.</p>
                <p>🏥 แผนก {item.department_id || "ทั่วไป"}</p>
              </div>
              <span className={`${styles.historyStatus} ${item.status === 'done' ? styles.statusComplete : styles.statusCancel}`}>
                {item.status === 'done' ? "เสร็จสิ้น" : "ยกเลิกแล้ว"}
              </span>
            </div>
          )) : <p className={styles.noData}>ยังไม่มีประวัติการนัดหมาย</p>}
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Software Development | สุขภาพนัดได้</p>
        <p>Present by Group 3</p>
      </footer>
    </div>
  );
}