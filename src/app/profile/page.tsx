"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

interface ModalConfig {
  open: boolean;
  type: "success" | "error" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
}

function AppModal({ config, onClose }: { config: ModalConfig; onClose: () => void }) {
  if (!config.open) return null;
  const isSuccess = config.type === "success";
  const isConfirm = config.type === "confirm";
  const handleConfirm = () => { onClose(); config.onConfirm?.(); };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.modalIconWrap} ${isSuccess ? styles.modalIconSuccess : isConfirm ? styles.modalIconConfirm : styles.modalIconError}`}>
          {isSuccess ? (
            <svg viewBox="0 0 52 52" className={styles.modalSvg}>
              <circle cx="26" cy="26" r="25" fill="none" className={styles.modalCircle} />
              <path fill="none" d="M14 27l7 7 17-17" strokeLinecap="round" strokeLinejoin="round" className={styles.modalCheck} />
            </svg>
          ) : isConfirm ? (
            <svg viewBox="0 0 52 52" className={styles.modalSvg}>
              <circle cx="26" cy="26" r="25" fill="none" className={styles.modalCircleConfirm} />
              <path fill="none" d="M26 16 L26 28 M26 34 L26 36" strokeLinecap="round" className={styles.modalExclaim} />
            </svg>
          ) : (
            <svg viewBox="0 0 52 52" className={styles.modalSvg}>
              <circle cx="26" cy="26" r="25" fill="none" className={styles.modalCircleError} />
              <path fill="none" d="M16 16 L36 36 M36 16 L16 36" strokeLinecap="round" className={styles.modalCross} />
            </svg>
          )}
        </div>
        <h3 className={styles.modalTitle}>{config.title}</h3>
        <p className={styles.modalMessage}>{config.message}</p>
        {isConfirm ? (
          <div className={styles.modalConfirmBtns}>
            <button className={styles.modalBtnCancel} onClick={onClose}>ยกเลิก</button>
            <button className={styles.modalBtnConfirmYes} onClick={handleConfirm}>ยืนยัน</button>
          </div>
        ) : (
          <button className={`${styles.modalBtn} ${isSuccess ? styles.modalBtnSuccess : styles.modalBtnError}`} onClick={handleConfirm}>
            {isSuccess ? "เยี่ยมเลย!" : "รับทราบ"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, load_user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [avatarPreview, set_avatar_preview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<ModalConfig>({ open: false, type: "success", title: "", message: "" });
  const showModal = (type: "success" | "error" | "confirm", title: string, message: string, onConfirm?: () => void) => {
    setModal({ open: true, type, title, message, onConfirm });
  };
  const closeModal = () => setModal(prev => ({ ...prev, open: false }));

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
    if (!appointmentDate || !appointmentTime) return false;
    const now = new Date();
    const apDateStr = appointmentDate.split('T')[0];
    const [apYear, apMonth, apDay] = apDateStr.split('-').map(Number);
    const apDate = new Date(apYear, apMonth - 1, apDay);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (apDate < today) return true;
    if (apDate > today) return false;

    const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();
    const morningEnd = 9 * 60;
    const afternoonEnd = 13 * 60;
    const isMorning = appointmentTime.toLowerCase() === 'morning' ||
      (appointmentTime.includes(':') && parseInt(appointmentTime.split(':')[0]) < 12);

    if (isMorning && currentTimeInMinutes > morningEnd) return true;
    if (!isMorning && currentTimeInMinutes > afternoonEnd) return true;
    return false;
  };

  const [editOpen, set_edit_open] = useState(false);
  const [editForm, set_edit_form] = useState({ phone_number: "", password: "", confirmPassword: "" });
  const [editLoading, set_edit_loading] = useState(false);
  const [editMessage, set_edit_message] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handle_edit_submit = async () => {
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      set_edit_message({ text: "รหัสผ่านไม่ตรงกัน", type: "error" });
      return;
    }
    if (editForm.phone_number && editForm.phone_number.length !== 10) {
      set_edit_message({ text: "เบอร์โทรต้อง 10 หลัก", type: "error" });
      return;
    }

    set_edit_loading(true);
    try {
      // 🐧 Use FormData to support BLOB upload
      const formData = new FormData();
      formData.append("identification_number", user?.identification_number || "");

      if (editForm.phone_number) formData.append("phone_number", editForm.phone_number);
      if (editForm.password) formData.append("password", editForm.password);

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("avatar", file);
      }

      const res = await fetch("/api/users/update", {
        method: "PATCH",
        // Do NOT set Content-Type header for FormData
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        set_edit_message({ text: "อัปเดตสำเร็จ! ✅", type: "success" });
        await load_user(); // Refresh fresh data including new BLOB
        setTimeout(() => {
          set_edit_open(false);
          set_edit_message(null);
          set_avatar_preview(null); // Clear temporary preview
        }, 1500);
      } else {
        set_edit_message({ text: data.error || "เกิดข้อผิดพลาด", type: "error" });
      }
    } catch {
      set_edit_message({ text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", type: "error" });
    } finally {
      set_edit_loading(false);
    }
  };

  // ... (autoCancelExpired and can_confirm functions remain exactly the same)
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
        } catch (error) { console.error("Auto cancel failed:", error); }
      }
      fetchAppointments();
    };
    if (appointments.length > 0) autoCancelExpired();
  }, [appointments, fetchAppointments]);

  const can_confirm = (appointmentTime: string, appointmentDate: string) => {
    if (!appointmentDate || !appointmentTime) return false;
    const now = new Date();
    const apDateStr = appointmentDate.split('T')[0];
    const [apYear, apMonth, apDay] = apDateStr.split('-').map(Number);
    const apDate = new Date(apYear, apMonth - 1, apDay);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (apDate.getTime() !== today.getTime()) return false;
    const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();
    const morningStart = 8 * 60;
    const morningEnd = 9 * 60;
    const afternoonStart = 12 * 60;
    const afternoonEnd = 13 * 60;
    const isMorning = appointmentTime.toLowerCase() === 'morning' ||
      (appointmentTime.includes(':') && parseInt(appointmentTime.split(':')[0]) < 12);
    if (isMorning) {
      return currentTimeInMinutes >= morningStart && currentTimeInMinutes <= morningEnd;
    } else {
      return currentTimeInMinutes >= afternoonStart && currentTimeInMinutes <= afternoonEnd;
    }
  };

  const handle_status_update = async (ap_id: number, newStatus: string) => {
  const doUpdate = async () => {
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
        showModal(
          "success",
          newStatus === "done" ? "ยืนยันสำเร็จ! 🎉" : "ยกเลิกเรียบร้อย",
          newStatus === "done" ? "ระบบได้รับการยืนยันของคุณแล้ว" : "ยกเลิกนัดหมายเรียบร้อยแล้ว"
        );
      }
    } catch {
      showModal("error", "เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (newStatus === "cancel") {
    showModal("confirm", "ยืนยันการยกเลิก", "คุณต้องการยกเลิกนัดหมายนี้ใช่หรือไม่?", doUpdate);
    return;
  }
  doUpdate();
};

  const upcoming = appointments.filter(ap =>
    (!ap.status || ap.status === "pending") && !is_expired(ap.date, ap.time)
  );

  const history = appointments.filter(ap =>
    ap.status === "done" ||
    ap.status === "cancel" ||
    (is_expired(ap.date, ap.time) && ap.status !== "done")
  );

  return (
    <div className={styles.container}>
      <AppModal config={modal} onClose={closeModal} />
      {/* ================= PROFILE CARD ================= */}
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {/* 🐧 Prioritize Local Preview, then DB URL, then Initial */}
            {avatarPreview || user?.avatar_url ? (
              <img src={avatarPreview ?? user?.avatar_url ?? undefined} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarInitial}>
                {user?.fname?.charAt(0) || "?"}
              </div>
            )}
            <div className={styles.avatarOverlay}></div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) set_avatar_preview(URL.createObjectURL(file));
            }}
          />
          <h1 className={styles.userName}>
            {user?.title || ""}{user?.fname} {user?.lname}
          </h1>
        </div>

        <div className={styles.infoRow}>
          <div>
            <p className={styles.infoLabel}>เลขบัตรประชาชน</p>
            <p className={styles.infoValue}>{user?.identification_number || "-"}</p>
          </div>
          <div>
            <p className={styles.infoLabel}>เบอร์โทรศัพท์</p>
            <p className={styles.infoValue}>{user?.phone_number || "-"}</p>
          </div>
          <div>
            <p className={styles.infoLabel}>อีเมล</p>
            <p className={styles.infoValue}>{user?.email || "-"}</p>
          </div>
          <div>
            <p className={styles.infoLabel}>วันเกิด</p>
            <p className={styles.infoValue}>{user?.birth_date?.split("T")[0] || "-"}</p>
          </div>
        </div>

        <button className={styles.editButton} onClick={() => {
          set_edit_open(true);
          set_edit_form({ phone_number: "", password: "", confirmPassword: "" });
          set_edit_message(null);
        }}>
          แก้ไขโปรไฟล์
        </button>
      </div>

      {/* ================= APPOINTMENT CARD (Unchanged) ================= */}
      <div className={styles.appointmentCard}>
        {/* ... existing appointment card logic ... */}
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>นัดที่กำลังจะมาถึง</h3>
          {upcoming.length > 0 ? (upcoming.map((ap) => {
            const isConfirmable = can_confirm(ap.time, ap.date);
            return (
              <div key={ap.ap_id} className={styles.upcomingCard}>
                <div className={styles.countdownBanner}>
                  {isConfirmable ? "✨ ขณะนี้เปิดให้กดยืนยันการมาตามนัดแล้ว" : "⌛ กรุณายืนยันในวันนัด"}
                </div>
                <div className={styles.appointmentInfo}>
                  <div className={styles.appointmentDate}>
                    <h3 className={styles.dateText}>{ap.date?.split("T")[0]}</h3>
                    <p className={styles.timeText}>เวลา {ap.time} น.</p>
                    <span className={styles.statusBadge}>รอยืนยัน</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <p><span className={styles.detailLabel}>แผนก:</span> {DEPT_ICONS[ap.dno] || "🏥"}{" "} {ap.department_name}</p>
                    <p><span className={styles.detailLabel}>รหัสนัด:</span> {ap.ap_id}</p>
                  </div>
                </div>
                <div className={styles.appointmentActions}>
                  <button className={styles.confirmButton} onClick={() => isConfirmable ? handle_status_update(ap.ap_id, "done") : showModal("error", "ยังไม่ถึงเวลา", "กรุณายืนยันในช่วงเวลานัดของวันนัดหมาย")} disabled={isActionLoading}>ยืนยันนัด</button>
                  <button className={styles.cancelButton} onClick={() => handle_status_update(ap.ap_id, "cancel")} disabled={isActionLoading}>ยกเลิก</button>
                </div>
              </div>
            );
          })) : <div className={styles.noData}>ไม่มีรายการนัดหมาย</div>}
        </div>
        <div className={styles.divider}></div>
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>ประวัติการนัดหมาย</h3>
          {history.length > 0 ? (history.map((item) => (
            <div key={item.ap_id} className={styles.historyCard}>
              <div className={styles.historyDate}>{item.date?.split("T")[0]}</div>
              <div className={styles.historyContent}>
                <p>เวลา {item.time} น.</p>
                <p>{DEPT_ICONS[item.dno] || "🏥"} {item.department_name}</p>
              </div>
              <span className={`${styles.historyStatus} ${item.status === "done" ? styles.statusComplete : styles.statusCancel}`}>
                {item.status === "done" ? "เสร็จสิ้น" : "ยกเลิก"}
              </span>
            </div>
          ))) : <p className={styles.noData}>ยังไม่มีประวัติ</p>}
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editOpen && (
        <>
          <div className={styles.modalBackdrop} onClick={() => set_edit_open(false)} />
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>แก้ไขโปรไฟล์</h2>
            <div className={styles.modalAvatarWrap}>
              <div className={styles.modalAvatar} onClick={() => fileInputRef.current?.click()}>
                {/* 🐧 Updated Modal Preview */}
                {avatarPreview || user?.avatar_url ? (
                  <img src={avatarPreview ?? user?.avatar_url ?? undefined} alt="avatar" className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarInitial}>{user?.fname?.charAt(0) || "?"}</div>
                )}
                <div className={styles.avatarOverlay}></div>
              </div>
              <p className={styles.modalAvatarHint}>คลิกเพื่อเปลี่ยนรูป</p>
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>เบอร์โทรศัพท์ใหม่</label>
              <input type="text" maxLength={10} placeholder={user?.phone_number} value={editForm.phone_number} onChange={(e) => set_edit_form(f => ({ ...f, phone_number: e.target.value.replace(/\D/g, "") }))} className={styles.modalInput} />
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>รหัสผ่านใหม่</label>
              <input type="password" placeholder="ปล่อยว่างถ้าไม่เปลี่ยน" value={editForm.password} onChange={(e) => set_edit_form(f => ({ ...f, password: e.target.value }))} className={styles.modalInput} />
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>ยืนยันรหัสผ่านใหม่</label>
              <input type="password" placeholder="ยืนยันรหัสผ่าน" value={editForm.confirmPassword} onChange={(e) => set_edit_form(f => ({ ...f, confirmPassword: e.target.value }))} className={styles.modalInput} />
            </div>
            {editMessage && <p className={`${styles.modalMessage} ${editMessage.type === "error" ? styles.modalError : styles.modalSuccess}`}>{editMessage.text}</p>}
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => set_edit_open(false)}>ยกเลิก</button>
              <button className={styles.modalSave} onClick={handle_edit_submit} disabled={editLoading}>{editLoading ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}