"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import styles from "./staffqueue.module.css";

const DEPT_NAMES: { [key: number]: string } = {
  1: "อายุรกรรม",
  2: "ห้องปฏิบัติการ",
  3: "กุมารเวช",
  4: "ผิวหนัง",
  5: "กระดูก",
  6: "ตรวจสุขภาพ",
};

interface Patient {
  ap_id: number;
  name: string;
  token: string;
  identification_number?: string;
}

interface ModalConfig {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onConfirm?: () => void;
}

function AppModal({ config, onClose }: { config: ModalConfig; onClose: () => void }) {
  if (!config.open) return null;
  const isSuccess = config.type === "success";
  const handleConfirm = () => { onClose(); config.onConfirm?.(); };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.modalIconWrap} ${isSuccess ? styles.modalIconSuccess : styles.modalIconError}`}>
          {isSuccess ? (
            <svg viewBox="0 0 52 52" className={styles.modalSvg}>
              <circle cx="26" cy="26" r="25" fill="none" className={styles.modalCircle} />
              <path fill="none" d="M14 27l7 7 17-17" strokeLinecap="round" strokeLinejoin="round" className={styles.modalCheck} />
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
        <button className={`${styles.modalBtn} ${isSuccess ? styles.modalBtnSuccess : styles.modalBtnError}`} onClick={handleConfirm}>
          {isSuccess ? "เยี่ยมเลย!" : "รับทราบ"}
        </button>
      </div>
    </div>
  );
}

const StaffQueuePage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading, load_user } = useAuthStore();

  const [currentQueue, setCurrentQueue] = useState<Patient | null>(null);
  const [waitingList, setWaitingList] = useState<Patient[]>([]);
  const [servingTime, setServingTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<ModalConfig>({ open: false, type: "success", title: "", message: "" });
  const showModal = (type: "success" | "error", title: string, message: string, onConfirm?: () => void) => {
    setModal({ open: true, type, title, message, onConfirm });
  };
  const closeModal = () => setModal(prev => ({ ...prev, open: false }));

  // สร้างรหัสคิวโดยอิงจากแผนกและ ap_id
  const getQueueCode = (dno: number, ap_id: number) => {
    const deptLetter = String.fromCharCode(64 + dno); // A, B, C...
    return `${deptLetter}${String(ap_id).padStart(2, '0')}`;
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // ดึงข้อมูลคิวสำหรับแผนกแพทย์
  const fetchQueueData = useCallback(async () => {
    if (!user?.dno) return;

    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // ดึงข้อมูลการนัดหมายสำหรับแผนกนี้ที่มีสถานะ "เสร็จสิ้น" (ยืนยันแล้ว)
      const res = await fetch(`/api/booking?all=true`);
      const data = await res.json();

      if (data.success) {
        // ฟิลเตอร์ตามแผนกและวันที่
        const deptAppointments = data.data
          .filter((ap: any) => 
            ap.dno === user.dno && 
            ap.date === todayStr && 
            ap.status === "done"
          )
          .map((ap: any) => ({
            ap_id: ap.ap_id,
            name: `${ap.title}${ap.fname} ${ap.lname}`,
            token: getQueueCode(user.dno!, ap.ap_id),
            identification_number: ap.identification_number,
          }));

        // แสดงคิวแรก แล้วที่เหลือรอก่อน
        if (deptAppointments.length > 0) {
          setCurrentQueue(deptAppointments[0]);
          setWaitingList(deptAppointments.slice(1));
        } else {
          setCurrentQueue(null);
          setWaitingList([]);
        }
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.dno]);

  useEffect(() => {
    load_user();
  }, [load_user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user?.role !== "doctor") {
      router.push("/");
      return;
    }

    if (user?.dno) {
      fetchQueueData();
    }
  }, [isLoading, user, router, fetchQueueData]);

  // แสดงเวลาที่ให้บริการคิวปัจจุบัน
  useEffect(() => {
    if (!currentQueue) return;

    const timer = setInterval(() => {
      setServingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQueue]);

  // รีเฟรชข้อมูลคิวอัตโนมัติทุก 30 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueueData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchQueueData]);

  // ส่ง notification แจ้งคิว
  const sendQueueNotification = async (patient: Patient, title: string, message: string) => {
    if (!patient.identification_number) return;
    
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: patient.identification_number,
          title,
          message,
          type: "queue",
          related_ap_id: patient.ap_id,
        }),
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handleNext = async () => {
    if (waitingList.length === 0) {
      showModal("error", "ไม่มีคิวถัดไป", "ขณะนี้ไม่มีคิวรอให้บริการแล้ว");
      return;
    }

    const nextPatient = waitingList[0];
    const deptName = DEPT_NAMES[user?.dno || 0] || "ไม่ระบุ";

    // แจ้งคนที่ถึงคิว
    await sendQueueNotification(
      nextPatient,
      "ถึงคิวของคุณแล้ว",
      `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${nextPatient.token}`
    );

    // แจ้งคนถัดไปว่าใกล้ถึงคิว
    if (waitingList.length > 1) {
      const upcomingPatient = waitingList[1];
      await sendQueueNotification(
        upcomingPatient,
        "เตรียมตัว",
        `คิวของคุณจะถึงเร็วๆนี้ แผนก${deptName} คิวหมายเลข ${upcomingPatient.token}`
      );
    }

    // คิวต่อไป
    setCurrentQueue(nextPatient);
    setWaitingList(waitingList.slice(1));
    setServingTime(0);
  };

  const handleRecall = async () => {
    if (!currentQueue) return;
    
    const deptName = DEPT_NAMES[user?.dno || 0] || "ไม่ระบุ";
    
    // แจ้งเรียกซ้ำ
    await sendQueueNotification(
      currentQueue,
      "เรียกซ้ำ",
      `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${currentQueue.token}`
    );
    
    showModal("success", "เรียกซ้ำแล้ว", `เรียกซ้ำคิว ${currentQueue.token} เรียบร้อย`);
  };

  const handleSkip = async () => {
    if (!currentQueue) return;
    
    const deptName = DEPT_NAMES[user?.dno || 0] || "ไม่ระบุ";
    
    // แจ้งคนที่ถูกข้ามว่าถูกข้ามไป (ย้ายไปรอท้ายคิว)
    await sendQueueNotification(
      currentQueue,
      "⏭️ คิวของคุณถูกข้าม",
      `คิว ${currentQueue.token} แผนก${deptName} ถูกข้ามชั่วคราว กรุณารอเรียกใหม่อีกครั้ง`
    );
    
    // ย้ายคิวปัจจุบันไปที่สุดท้าย
    const newWaitingList = [...waitingList, currentQueue];
    
    if (waitingList.length > 0) {
      const nextPatient = waitingList[0];
      
      // แจ้งคนถัดไปว่าถึงคิว
      await sendQueueNotification(
        nextPatient,
        "ถึงคิวของคุณแล้ว",
        `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${nextPatient.token}`
      );
      
      setCurrentQueue(nextPatient);
      setWaitingList(newWaitingList.slice(1));
    } else {
      setCurrentQueue(null);
      setWaitingList(newWaitingList);
    }
    setServingTime(0);
  };

  const handleComplete = async () => {
    if (!currentQueue) return;

    // อัปเดตสถานะการนัดหมายเป็น "completed"
    try {
      await fetch("/api/booking/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ap_id: currentQueue.ap_id,
          status: "completed",
        }),
      });

      // ย้ายไปคิวถัดไป
      if (waitingList.length > 0) {
        setCurrentQueue(waitingList[0]);
        setWaitingList(waitingList.slice(1));
      } else {
        setCurrentQueue(null);
      }
      setServingTime(0);
    } catch (error) {
      console.error("Error completing queue:", error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className={styles.container}>
        <AppModal config={modal} onClose={closeModal} />
        <div className={styles.mainCard}>
          <p style={{ textAlign: "center", padding: "2rem" }}>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user?.dno) {
    return (
      <div className={styles.container}>
        <AppModal config={modal} onClose={closeModal} />
        <div className={styles.mainCard}>
          <p style={{ textAlign: "center", padding: "2rem", color: "#ef4444" }}>
            ไม่พบข้อมูลแผนกของคุณ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AppModal config={modal} onClose={closeModal} />
      <div className={styles.mainCard}>
        <div className={styles.displaySection}>
          <span className={styles.deptTitle}>แผนก{DEPT_NAMES[user.dno] || `แผนก ${user.dno}`}</span>
          <p className={styles.statusLabel}>กำลังให้บริการคิวหมายเลข</p>

          <div className={styles.tokenBox}>
            <span className={styles.tokenNumber}>
              {currentQueue ? currentQueue.token : "-"}
            </span>
          </div>

          <div className="text-center w-full max-w-sm mt-4 p-4 bg-[#F8FAFC] rounded-xl border">
            <p className="text-gray-500 font-medium">
              Serving Time:{" "}
              <span className="font-bold text-[#10B981] text-2xl">
                {formatTime(servingTime)}
              </span>
            </p>
          </div>
        </div>

        <div className={styles.actionSection}>
          <button 
            className={`${styles.btnAction} ${styles.btnNext}`}
            onClick={handleNext}
            disabled={waitingList.length === 0}
          >
            เรียกคิวถัดไป (Next)
          </button>

          <button 
            className={`${styles.btnAction} ${styles.btnRecall}`}
            onClick={handleRecall}
            disabled={!currentQueue}
          >
            เรียกซ้ำ (Recall)
          </button>

          <button 
            className={`${styles.btnAction} ${styles.btnSkip}`}
            onClick={handleSkip}
            disabled={!currentQueue}
          >
            ข้ามคิว (Skip)
          </button>

          <button 
            className={`${styles.btnAction} ${styles.btnComplete}`}
            onClick={handleComplete}
            disabled={!currentQueue}
          >
            สำเร็จคิว (Complete)
          </button>
        </div>

        <div className={styles.listSection}>
          <div className="flex justify-between items-end border-b-2 pb-3 mb-4">
            <h3 className={styles.listHeaderTitle}>ลำดับคิวรอตรวจ</h3>
            <span className="text-lg font-bold text-[#5DB996]">
              {waitingList.length} คนในระบบ
            </span>
          </div>

          <div className={styles.patientList}>
            {waitingList.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                ไม่มีคิวรอตรวจ
              </p>
            ) : (
              waitingList.map((patient, index) => (
                <div
                  key={patient.ap_id}
                  className={`${styles.patientItem} ${index === 0 ? styles.nextHighlight : ""}`}
                >
                  <div>
                    <p className="font-bold text-gray-800 text-lg">
                      {patient.name}
                    </p>
                    <p className="text-sm text-gray-400">ID: {patient.ap_id}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-gray-400 font-bold"># {index + 1}</span>
                    <p className="text-[#5DB996] font-black text-2xl bg-white px-4 py-2 rounded-full shadow-inner">
                      {patient.token}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-semibold hover:border-[#5DB996] hover:text-[#5DB996] hover:bg-[#F0FDF4] transition">
            + เพิ่มคนไข้นอกนัดหมาย
          </button>
        </div>
      </div>
    </div>
  );
};
export default StaffQueuePage;
