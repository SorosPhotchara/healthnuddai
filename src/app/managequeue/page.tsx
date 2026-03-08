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

const TITLE_OPTIONS = ["นาย", "นาง", "นางสาว"];

interface Patient {
  ap_id: number;
  name: string;
  token: string;
  identification_number?: string;
}

interface WalkInForm {
  idNumber: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  sex: string;
  birthDate: string;
  isSmoking: boolean;
  isDrinking: boolean;
  hasFoodAllergy: boolean;
  foodAllergyDetail: string;
  hasDrugAllergy: boolean;
  drugAllergyDetail: string;
  hasUnderlyingDisease: boolean;
  underlyingDiseaseDetail: string;
  time: "morning" | "afternoon";
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

  // Modal state
  const [modal, setModal] = useState<ModalConfig>({ open: false, type: "success", title: "", message: "" });
  const showModal = (type: "success" | "error", title: string, message: string, onConfirm?: () => void) => {
    setModal({ open: true, type, title, message, onConfirm });
  };
  const closeModal = () => setModal(prev => ({ ...prev, open: false }));

  // Walk-in popup state
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInForm, setWalkInForm] = useState<WalkInForm>({
    idNumber: "",
    title: "นาย",
    firstName: "",
    lastName: "",
    phone: "",
    sex: "",
    birthDate: "",
    isSmoking: false,
    isDrinking: false,
    hasFoodAllergy: false,
    foodAllergyDetail: "",
    hasDrugAllergy: false,
    drugAllergyDetail: "",
    hasUnderlyingDisease: false,
    underlyingDiseaseDetail: "",
    time: "morning",
  });

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
          .sort((a: any, b: any) => {
            // เรียงตาม skip_count (น้อย -> มาก) แล้วตาม ap_id
            const skipA = a.skip_count || 0;
            const skipB = b.skip_count || 0;
            if (skipA !== skipB) return skipA - skipB;
            return a.ap_id - b.ap_id;
          })
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
    
    try {
      // บันทึกการข้ามคิวลง database
      const res = await fetch("/api/booking/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ap_id: currentQueue.ap_id }),
      });
      
      if (!res.ok) {
        alert("เกิดข้อผิดพลาดในการข้ามคิว");
        return;
      }
      
      // แจ้งคนที่ถูกข้ามว่าถูกข้ามไป (ย้ายไปรอท้ายคิว)
      await sendQueueNotification(
        currentQueue,
        "⏭️ คิวของคุณถูกข้าม",
        `คิว ${currentQueue.token} แผนก${deptName} ถูกข้ามชั่วคราว กรุณารอเรียกใหม่อีกครั้ง`
      );
      
      // แจ้งคนถัดไปว่าถึงคิวแล้ว (waitingList[0] จะกลายเป็นคิวแรก)
      if (waitingList.length > 0) {
        const nextQueue = waitingList[0];
        await sendQueueNotification(
          nextQueue,
          "🔔 ถึงคิวของคุณแล้ว",
          `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${nextQueue.token}`
        );
        
        // แจ้งคนที่สอง (waitingList[1]) ให้เตรียมตัว
        if (waitingList.length > 1) {
          const prepareQueue = waitingList[1];
          await sendQueueNotification(
            prepareQueue,
            "⏳ เตรียมตัว",
            `คิว ${prepareQueue.token} แผนก${deptName} ใกล้ถึงคิวของคุณแล้ว กรุณาเตรียมตัว`
          );
        }
      }
      
      // รีเฟรชข้อมูลคิวจาก database
      await fetchQueueData();
      setServingTime(0);
    } catch (error) {
      console.error("Skip error:", error);
      alert("เกิดข้อผิดพลาดในการข้ามคิว");
    }
  };

  // เพิ่มคนไข้นอกนัดหมาย
  const handleWalkInSubmit = async () => {
    if (!walkInForm.idNumber || !walkInForm.firstName || !walkInForm.lastName || !user?.dno) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setWalkInLoading(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Walk-in ไม่ต้องเช็ค quota (ไม่นับรวมในโควตา)

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identificationNumber: walkInForm.idNumber,
          title: walkInForm.title,
          fname: walkInForm.firstName,
          lname: walkInForm.lastName,
          phoneNumber: walkInForm.phone || "-",
          sex: walkInForm.sex || "-",
          birthDate: walkInForm.birthDate || null,
          isSmoking: walkInForm.isSmoking,
          isDrinking: walkInForm.isDrinking,
          hasFoodAllergy: walkInForm.hasFoodAllergy,
          foodAllergyDetail: walkInForm.foodAllergyDetail,
          hasDrugAllergy: walkInForm.hasDrugAllergy,
          drugAllergyDetail: walkInForm.drugAllergyDetail,
          hasUnderlyingDisease: walkInForm.hasUnderlyingDisease,
          underlyingDiseaseDetail: walkInForm.underlyingDiseaseDetail,
          departmentId: user.dno,
          date: dateStr,
          time: walkInForm.time,
          status: "done", // ยืนยันทันที
          isWalkin: true, // เป็นคนไข้นอกนัดหมาย ไม่นับรวมโควตา
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("เพิ่มคนไข้สำเร็จ!");
        setWalkInOpen(false);
        setWalkInForm({
          idNumber: "",
          title: "นาย",
          firstName: "",
          lastName: "",
          phone: "",
          sex: "",
          birthDate: "",
          isSmoking: false,
          isDrinking: false,
          hasFoodAllergy: false,
          foodAllergyDetail: "",
          hasDrugAllergy: false,
          drugAllergyDetail: "",
          hasUnderlyingDisease: false,
          underlyingDiseaseDetail: "",
          time: "morning",
        });
        // รีเฟรชข้อมูล
        fetchQueueData();
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Walk-in error:", error);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setWalkInLoading(false);
    }
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
          {/* ปิดปุ่มคิวถัดไป - ใช้ระบบ auto notification แทน
          <button 
            className={`${styles.btnAction} ${styles.btnNext}`}
            onClick={handleNext}
            disabled={waitingList.length === 0}
          >
            เรียกคิวถัดไป (Next)
          </button>
          */}

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
          <div className="flex justify-between items-center border-b-2 pb-3 mb-4">
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

          <button 
            className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-semibold hover:border-[#5DB996] hover:text-[#5DB996] hover:bg-[#F0FDF4] transition"
            onClick={() => setWalkInOpen(true)}
          >
            + เพิ่มคนไข้นอกนัดหมาย
          </button>
        </div>
      </div>

      {/* Walk-in Modal */}
      {walkInOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setWalkInOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">เพิ่มคนไข้นอกนัดหมาย</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setWalkInOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* เลขบัตรประชาชน */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประชาชน *</label>
                <input
                  type="text"
                  maxLength={13}
                  value={walkInForm.idNumber}
                  onChange={(e) => setWalkInForm(prev => ({ ...prev, idNumber: e.target.value.replace(/\D/g, "") }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                  placeholder="กรอกเลข 13 หลัก"
                />
              </div>

              {/* คำนำหน้า */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า *</label>
                <div className="flex gap-2 flex-wrap">
                  {TITLE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        walkInForm.title === t
                          ? "bg-[#5DB996] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      onClick={() => setWalkInForm(prev => ({ ...prev, title: t }))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ชื่อ-นามสกุล */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                  <input
                    type="text"
                    value={walkInForm.firstName}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                    placeholder="ชื่อจริง"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    value={walkInForm.lastName}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                    placeholder="นามสกุล"
                  />
                </div>
              </div>

              {/* เบอร์โทร */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  maxLength={10}
                  value={walkInForm.phone}
                  onChange={(e) => setWalkInForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                  placeholder="เบอร์โทรศัพท์ (ถ้ามี)"
                />
              </div>

              {/* เพศ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      walkInForm.sex === "M"
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, sex: "M" }))}
                  >
                    ชาย
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      walkInForm.sex === "F"
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, sex: "F" }))}
                  >
                    หญิง
                  </button>
                </div>
              </div>

              {/* วันเกิด */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วัน/เดือน/ปีเกิด</label>
                <input
                  type="date"
                  value={walkInForm.birthDate}
                  onChange={(e) => setWalkInForm(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                />
              </div>

              {/* สูบบุหรี่ & ดื่มเหล้า */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สูบบุหรี่?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                        walkInForm.isSmoking === true
                          ? "bg-[#5DB996] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      onClick={() => setWalkInForm(prev => ({ ...prev, isSmoking: true }))}
                    >
                      สูบ
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                        walkInForm.isSmoking === false
                          ? "bg-[#5DB996] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      onClick={() => setWalkInForm(prev => ({ ...prev, isSmoking: false }))}
                    >
                      ไม่สูบ
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ดื่มเหล้า?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                        walkInForm.isDrinking === true
                          ? "bg-[#5DB996] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      onClick={() => setWalkInForm(prev => ({ ...prev, isDrinking: true }))}
                    >
                      ดื่ม
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                        walkInForm.isDrinking === false
                          ? "bg-[#5DB996] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      onClick={() => setWalkInForm(prev => ({ ...prev, isDrinking: false }))}
                    >
                      ไม่ดื่ม
                    </button>
                  </div>
                </div>
              </div>

              {/* แพ้อาหาร */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แพ้อาหาร?</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      walkInForm.hasFoodAllergy === false
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, hasFoodAllergy: false, foodAllergyDetail: "" }))}
                  >
                    ไม่แพ้
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      walkInForm.hasFoodAllergy === true
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, hasFoodAllergy: true }))}
                  >
                    แพ้
                  </button>
                </div>
                {walkInForm.hasFoodAllergy && (
                  <textarea
                    value={walkInForm.foodAllergyDetail}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, foodAllergyDetail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                    placeholder="ระบุอาหารที่แพ้"
                    rows={2}
                  />
                )}
              </div>

              {/* แพ้ยา */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แพ้ยา?</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      walkInForm.hasDrugAllergy === false
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, hasDrugAllergy: false, drugAllergyDetail: "" }))}
                  >
                    ไม่แพ้
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      walkInForm.hasDrugAllergy === true
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, hasDrugAllergy: true }))}
                  >
                    แพ้
                  </button>
                </div>
                {walkInForm.hasDrugAllergy && (
                  <textarea
                    value={walkInForm.drugAllergyDetail}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, drugAllergyDetail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                    placeholder="ระบุยาที่แพ้"
                    rows={2}
                  />
                )}
              </div>

              {/* โรคประจำตัว */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โรคประจำตัว?</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      walkInForm.hasUnderlyingDisease === false
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, hasUnderlyingDisease: false, underlyingDiseaseDetail: "" }))}
                  >
                    ไม่มี
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                      walkInForm.hasUnderlyingDisease === true
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, hasUnderlyingDisease: true }))}
                  >
                    มี
                  </button>
                </div>
                {walkInForm.hasUnderlyingDisease && (
                  <textarea
                    value={walkInForm.underlyingDiseaseDetail}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, underlyingDiseaseDetail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5DB996] focus:border-transparent"
                    placeholder="ระบุโรคประจำตัว"
                    rows={2}
                  />
                )}
              </div>

              {/* ช่วงเวลา */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ช่วงเวลา *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
                      walkInForm.time === "morning"
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, time: "morning" }))}
                  >
                    ☀️ ช่วงเช้า
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
                      walkInForm.time === "afternoon"
                        ? "bg-[#5DB996] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setWalkInForm(prev => ({ ...prev, time: "afternoon" }))}
                  >
                    🌤️ ช่วงบ่าย
                  </button>
                </div>
              </div>
            </div>

            {/* ปุ่ม */}
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
                onClick={() => setWalkInOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                className="flex-1 py-3 bg-[#5DB996] text-white rounded-xl font-medium hover:bg-[#4aa882] transition disabled:opacity-50"
                onClick={handleWalkInSubmit}
                disabled={walkInLoading}
              >
                {walkInLoading ? "กำลังบันทึก..." : "เพิ่มคนไข้"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffQueuePage;
