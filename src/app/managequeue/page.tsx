"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import styles from "./staffqueue.module.css";

const DEPT_NAMES: { [key: number]: string } = {
  1: "อายุรกรรม", 2: "ห้องปฏิบัติการ", 3: "กุมารเวช",
  4: "ผิวหนัง", 5: "กระดูก", 6: "ตรวจสุขภาพ",
};

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

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

// ---------------------------------------------------------
// 🐧 1. App Modal Component (Fixed to show dynamic titles!)
// ---------------------------------------------------------
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

        {/* 🐧 Uses config.title directly to show whatever text you pass! */}
        <h3 className={styles.modalTitle} style={{ color: "black", marginBottom: isSuccess ? "0" : "1rem" }}>
          {config.title}
        </h3>

        {!isSuccess && config.message && (
          <p className={styles.modalMessage} style={{ color: "black" }}>{config.message}</p>
        )}

        {!isSuccess && (
          <button className={`${styles.modalBtn} ${styles.modalBtnError}`} onClick={handleConfirm}>
            รับทราบ
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 🐧 2. Birth Date Picker Component
// ---------------------------------------------------------
function BirthDatePicker({ value, onChange }: { value: Date | null; onChange: (date: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "month" | "year">("day");
  const defaultNav = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 25); return new Date(d.getFullYear(), d.getMonth(), 1); };
  const [nav, setNav] = useState<Date>(value ? new Date(value.getFullYear(), value.getMonth(), 1) : defaultNav());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setMode("day"); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => { if (value) setNav(new Date(value.getFullYear(), value.getMonth(), 1)); }, [value]);

  const daysInMonth = new Date(nav.getFullYear(), nav.getMonth() + 1, 0).getDate();
  const firstDow = new Date(nav.getFullYear(), nav.getMonth(), 1).getDay();
  const yearList = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() + 543 - i);
  const beYear = nav.getFullYear() + 543;
  const isSel = (day: number) => value && value.getDate() === day && value.getMonth() === nav.getMonth() && value.getFullYear() === nav.getFullYear();
  const triggerLabel = value ? `${value.getDate().toString().padStart(2, "0")}/${(value.getMonth() + 1).toString().padStart(2, "0")}/${value.getFullYear()} (${value.getDate()} ${THAI_MONTHS_FULL[value.getMonth()]} ${value.getFullYear() + 543})` : "เลือกวันเกิด";

  return (
    <div className={styles.bpWrapper} ref={wrapRef}>
      <button type="button" className={`${styles.bpTrigger} ${value ? styles.bpTriggerFilled : ""}`} onClick={() => { setOpen(o => !o); setMode("day"); }}>
        <span className={styles.bpTriggerIcon}>📅</span>
        <span className={value ? styles.bpTriggerValue : styles.bpTriggerPlaceholder}>{triggerLabel}</span>
        <span className={styles.bpTriggerChevron}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className={styles.bpPopup}>
          <div className={styles.bpHeader}>
            {mode === "day" && <button type="button" className={styles.bpNavBtn} onClick={() => setNav(new Date(nav.getFullYear(), nav.getMonth() - 1, 1))}>‹</button>}
            <div className={styles.bpHeaderCenter}>
              {mode === "day" && (<><button type="button" className={styles.bpHeaderBtn} onClick={() => setMode("month")}>{THAI_MONTHS_FULL[nav.getMonth()]}</button><button type="button" className={styles.bpHeaderBtn} onClick={() => setMode("year")}>{beYear}</button></>)}
              {mode === "month" && <span className={styles.bpModeTitle}>เลือกเดือน — {beYear}</span>}
              {mode === "year" && <span className={styles.bpModeTitle}>เลือกปี (พ.ศ.)</span>}
            </div>
            {mode === "day" ? <button type="button" className={styles.bpNavBtn} onClick={() => setNav(new Date(nav.getFullYear(), nav.getMonth() + 1, 1))}>›</button> : <button type="button" className={styles.bpCloseBtn} onClick={() => setMode("day")}>✕</button>}
          </div>
          {mode === "day" && (
            <div className={styles.bpDays}>
              {Array.from({ length: firstDow }).map((_, i) => <div key={`g${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <button key={day} type="button" className={`${styles.bpDay} ${isSel(day) ? styles.bpDaySelected : ""}`} onClick={() => { onChange(new Date(nav.getFullYear(), nav.getMonth(), day)); setOpen(false); setMode("day"); }}>{day}</button>
              ))}
            </div>
          )}
          {mode === "month" && <div className={styles.bpMonthGrid}>{THAI_MONTHS_SHORT.map((name, idx) => <button key={idx} type="button" className={styles.bpMonthBtn} onClick={() => { setNav(new Date(nav.getFullYear(), idx, 1)); setMode("day"); }}>{name}</button>)}</div>}
          {mode === "year" && <div className={styles.bpYearList}>{yearList.map(y => <button key={y} type="button" className={styles.bpYearBtn} onClick={() => { setNav(new Date(y - 543, nav.getMonth(), 1)); setMode("month"); }}>{y}</button>)}</div>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// 🐧 3. Main Staff Queue Page
// ---------------------------------------------------------
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

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [birthDateObj, setBirthDateObj] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    idNumber: "",
    title: "นาย",
    firstName: "",
    lastName: "",
    phone: "",
    sex: "M",
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

  // Auto-Fill Function (Bypasses User Identity Check)
  useEffect(() => {
    const fetchExistingPatient = async () => {
      if (formData.idNumber.length === 13) {
        try {
          const res = await fetch(`/api/users/check?id=${formData.idNumber}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              const u = data.user;
              if (u.birth_date) {
                const parsed = new Date(u.birth_date);
                if (!isNaN(parsed.getTime())) setBirthDateObj(parsed);
              }
              setFormData(prev => ({
                ...prev,
                title: u.title || prev.title,
                firstName: u.fname || prev.firstName,
                lastName: u.lname || prev.lastName,
                phone: u.phone_number || prev.phone,
                sex: u.sex || prev.sex,
                birthDate: u.birth_date ? u.birth_date.split('T')[0] : prev.birthDate,
                isSmoking: u.is_smoking ?? prev.isSmoking,
                isDrinking: u.is_drinking ?? prev.isDrinking,
                hasFoodAllergy: !!u.food_allergy,
                foodAllergyDetail: u.food_allergy || prev.foodAllergyDetail,
                hasDrugAllergy: !!u.drug_allergy,
                drugAllergyDetail: u.drug_allergy || prev.drugAllergyDetail,
                hasUnderlyingDisease: !!u.underlying_disease,
                underlyingDiseaseDetail: u.underlying_disease || prev.underlyingDiseaseDetail,
              }));
            }
          }
        } catch (error) { console.error("Auto-fetch error:", error); }
      }
    };
    fetchExistingPatient();
  }, [formData.idNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "radio" || type === "checkbox") {
      const val = value === "true" ? true : value === "false" ? false : value;
      setFormData(prev => ({ ...prev, [name]: val }));
    } else {
      if (name === "idNumber" || name === "phone") {
        setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, "") }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleBirthSelect = (date: Date) => {
    setBirthDateObj(date);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setFormData(prev => ({ ...prev, birthDate: `${yyyy}-${mm}-${dd}` }));
  };

  const getQueueCode = (dno: number, ap_id: number) => `${String.fromCharCode(64 + dno)}${String(ap_id).padStart(2, '0')}`;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const fetchQueueData = useCallback(async () => {
    if (!user?.dno) return;
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const res = await fetch(`/api/booking?all=true`);
      const data = await res.json();
      if (data.success) {
        const deptAppointments = data.data
          .filter((ap: any) => ap.dno === user.dno && ap.date === todayStr && ap.status === "done")
          .sort((a: any, b: any) => (a.skip_count || 0) - (b.skip_count || 0) || a.ap_id - b.ap_id)
          .map((ap: any) => ({
            ap_id: ap.ap_id,
            name: `${ap.title}${ap.fname} ${ap.lname}`,
            token: getQueueCode(user.dno!, ap.ap_id),
            identification_number: ap.identification_number,
          }));
        if (deptAppointments.length > 0) {
          setCurrentQueue(deptAppointments[0]);
          setWaitingList(deptAppointments.slice(1));
        } else {
          setCurrentQueue(null);
          setWaitingList([]);
        }
      }
    } catch (error) { console.error("Error fetching queue:", error); }
    finally { setLoading(false); }
  }, [user?.dno]);

  useEffect(() => { load_user(); }, [load_user]);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/login"); return; }
    if (!isLoading && user?.role !== "doctor") { router.push("/"); return; }
    if (user?.dno) fetchQueueData();
  }, [isLoading, user, router, fetchQueueData]);

  useEffect(() => {
    if (!currentQueue) return;
    const timer = setInterval(() => setServingTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [currentQueue]);

  useEffect(() => {
    const interval = setInterval(() => fetchQueueData(), 30000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  const sendQueueNotification = async (patient: Patient, title: string, message: string) => {
    if (!patient.identification_number) return;
    try {
      await fetch("/api/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: patient.identification_number, title, message, type: "queue", related_ap_id: patient.ap_id }),
      });
    } catch (error) { console.error("Error sending notification:", error); }
  };

  const handleRecall = async () => {
    if (!currentQueue) return;
    const deptName = DEPT_NAMES[user?.dno || 0] || "ไม่ระบุ";
    try {
      await fetch("/api/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentQueue.identification_number, title: "เรียกซ้ำ", message: `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${currentQueue.token}`, type: "queue", related_ap_id: currentQueue.ap_id }),
      });
    } catch (e) { console.error(e); }

    showModal("success", "เรียกคนไข้ซ้ำเรียบร้อยแล้ว", "");
    setTimeout(() => { closeModal(); }, 2000);
  };

  // ---------------------------------------------------------
  // 🐧 Added Skip Modal logic
  // ---------------------------------------------------------
  const handleSkip = async () => {
    if (!currentQueue) return;
    const deptName = DEPT_NAMES[user?.dno || 0] || "ไม่ระบุ";
    try {
      const res = await fetch("/api/booking/skip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ap_id: currentQueue.ap_id }) });
      if (!res.ok) return;
      await sendQueueNotification(currentQueue, "⏭️ คิวของคุณถูกข้าม", `คิว ${currentQueue.token} แผนก${deptName} ถูกข้ามชั่วคราว`);
      await fetchQueueData();
      setServingTime(0);

      // Show specific text and auto close
      showModal("success", "ข้ามคิว", "");
      setTimeout(() => { closeModal(); }, 2000);

    } catch (error) { console.error("Skip error:", error); }
  };

  // ---------------------------------------------------------
  // 🐧 Added Complete Modal logic
  // ---------------------------------------------------------
  const handleComplete = async () => {
    if (!currentQueue) return;
    try {
      const res = await fetch("/api/booking/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ap_id: currentQueue.ap_id, status: "completed" }) });

      if (res.ok) {
        fetchQueueData();
        setServingTime(0);

        // Show specific text and auto close
        showModal("success", "บริการคนไข้เสร็จเรียบร้อย", "");
        setTimeout(() => { closeModal(); }, 2000);
      }
    } catch (error) { console.error("Error completing queue:", error); }
  };

  const handleWalkInSubmit = async () => {
    if (!formData.idNumber || !formData.firstName || !formData.lastName || !user?.dno) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน"); return;
    }
    setWalkInLoading(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const res = await fetch("/api/booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identificationNumber: formData.idNumber, title: formData.title, fname: formData.firstName, lname: formData.lastName,
          phoneNumber: formData.phone || "-", sex: formData.sex || "-", birthDate: formData.birthDate || null,
          isSmoking: formData.isSmoking, isDrinking: formData.isDrinking, hasFoodAllergy: formData.hasFoodAllergy, foodAllergyDetail: formData.foodAllergyDetail,
          hasDrugAllergy: formData.hasDrugAllergy, drugAllergyDetail: formData.drugAllergyDetail, hasUnderlyingDisease: formData.hasUnderlyingDisease, underlyingDiseaseDetail: formData.underlyingDiseaseDetail,
          departmentId: user.dno, date: dateStr, time: formData.time, status: "done", isWalkin: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showModal("success", "เพิ่มคนไข้สำเร็จ", "");
        setWalkInOpen(false);
        fetchQueueData();
        setTimeout(() => { closeModal(); }, 2000);
      }
      else { alert(data.error || "เกิดข้อผิดพลาด"); }
    } catch (error) { console.error("Walk-in error:", error); }
    finally { setWalkInLoading(false); }
  };

  if (isLoading || loading || !user) return <div className={styles.container}><div className={styles.mainCard}><p className="text-center p-8 w-full">กำลังโหลดข้อมูล...</p></div></div>;

  return (
    <div className={styles.container}>
      <AppModal config={modal} onClose={closeModal} />

      <div className={styles.mainCard}>
        <div className={styles.displaySection}>
          <span className={styles.deptTitle}>แผนก{DEPT_NAMES[user?.dno || 0] || `ไม่ระบุ`}</span>
          <p className={styles.statusLabel}>กำลังให้บริการคิวหมายเลข</p>
          <div className={styles.tokenBox}><span className={styles.tokenNumber}>{currentQueue ? currentQueue.token : "-"}</span></div>
          <div className="text-center w-full max-w-sm mt-4 p-4 bg-[#F8FAFC] rounded-xl border">
            <p className="text-gray-500 font-medium">Serving Time: <span className="font-bold text-[#10B981] text-2xl">{formatTime(servingTime)}</span></p>
          </div>
        </div>

        <div className={styles.actionSection}>
          <button className={`${styles.btnAction} ${styles.btnRecall}`} onClick={handleRecall} disabled={!currentQueue}>เรียกซ้ำ (Recall)</button>
          <button className={`${styles.btnAction} ${styles.btnSkip}`} onClick={handleSkip} disabled={!currentQueue}>ข้ามคิว (Skip)</button>
          <button className={`${styles.btnAction} ${styles.btnComplete}`} onClick={handleComplete} disabled={!currentQueue}>สำเร็จคิว (Complete)</button>
        </div>

        <div className={styles.listSection}>
          <div className="flex justify-between items-center border-b-2 pb-3 mb-4">
            <h3 className={styles.listHeaderTitle}>ลำดับคิวรอตรวจ</h3>
            <span className="text-lg font-bold text-[#5DB996]">{waitingList.length} คนในระบบ</span>
          </div>
          <div className={styles.patientList}>
            {waitingList.length === 0 ? <p className="text-center text-gray-400 p-8">ไม่มีคิวรอตรวจ</p> :
              waitingList.map((patient, index) => (
                <div key={patient.ap_id} className={`${styles.patientItem} ${index === 0 ? styles.nextHighlight : ""}`}>
                  <div><p className="font-bold text-gray-800 text-lg">{patient.name}</p><p className="text-sm text-gray-400">ID: {patient.ap_id}</p></div>
                  <div className="text-right flex items-center gap-3"><span className="text-gray-400 font-bold"># {index + 1}</span><p className="text-[#5DB996] font-black text-2xl bg-white px-4 py-2 rounded-full shadow-inner">{patient.token}</p></div>
                </div>
              ))}
          </div>
          <button className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-semibold hover:border-[#5DB996] hover:text-[#5DB996] hover:bg-[#F0FDF4] transition" onClick={() => setWalkInOpen(true)}>+ เพิ่มคนไข้นอกนัดหมาย</button>
        </div>
      </div>

      {walkInOpen && (
        <div className={styles.modalOverlay} onClick={() => setWalkInOpen(false)}>
          <div className={styles.modalBoxWalkIn} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">จัดการข้อมูลคนไข้</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setWalkInOpen(false)}>✕</button>
            </div>

            <div className={styles.stepContent}>
              <p className={styles.stepDescription}>กรุณากรอกข้อมูลให้ครบถ้วน</p>

              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>เลขบัตรประชาชน (ดึงข้อมูลอัตโนมัติ) *</label>
                  <input
                    type="text"
                    name="idNumber"
                    className={styles.input}
                    placeholder="0000000000000"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    maxLength={13}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>คำนำหน้า *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="title" value="นาย" checked={formData.title === "นาย"} onChange={handleInputChange} /> นาย
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="title" value="นาง" checked={formData.title === "นาง"} onChange={handleInputChange} /> นาง
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="title" value="นางสาว" checked={formData.title === "นางสาว"} onChange={handleInputChange} /> นางสาว
                    </label>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroupHalf}>
                    <label className={styles.label}>ชื่อ *</label>
                    <input type="text" name="firstName" className={styles.input} placeholder="ชื่อ" value={formData.firstName} onChange={handleInputChange} />
                  </div>
                  <div className={styles.formGroupHalf}>
                    <label className={styles.label}>นามสกุล *</label>
                    <input type="text" name="lastName" className={styles.input} placeholder="นามสกุล" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    name="phone"
                    className={styles.input}
                    placeholder="0000000000"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={10}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>วัน/เดือน/ปีเกิด *</label>
                  <BirthDatePicker value={birthDateObj} onChange={handleBirthSelect} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>เพศ *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="sex" value="M" checked={formData.sex === "M"} onChange={handleInputChange} /> ชาย
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="sex" value="F" checked={formData.sex === "F"} onChange={handleInputChange} /> หญิง
                    </label>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroupHalf}>
                    <label className={styles.label}>สูบบุหรี่ไหม? *</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input type="radio" name="isSmoking" value="true" checked={formData.isSmoking === true} onChange={handleInputChange} /> สูบ
                      </label>
                      <label className={styles.radioLabel}>
                        <input type="radio" name="isSmoking" value="false" checked={formData.isSmoking === false} onChange={handleInputChange} /> ไม่สูบ
                      </label>
                    </div>
                  </div>
                  <div className={styles.formGroupHalf}>
                    <label className={styles.label}>ดื่มเหล้าไหม? *</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input type="radio" name="isDrinking" value="true" checked={formData.isDrinking === true} onChange={handleInputChange} /> ดื่ม
                      </label>
                      <label className={styles.radioLabel}>
                        <input type="radio" name="isDrinking" value="false" checked={formData.isDrinking === false} onChange={handleInputChange} /> ไม่ดื่ม
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>แพ้อาหารไหม? *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="hasFoodAllergy" value="false" checked={formData.hasFoodAllergy === false} onChange={handleInputChange} /> ไม่แพ้
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="hasFoodAllergy" value="true" checked={formData.hasFoodAllergy === true} onChange={handleInputChange} /> แพ้
                    </label>
                  </div>
                  {formData.hasFoodAllergy && (
                    <textarea name="foodAllergyDetail" className={styles.textarea} placeholder="โปรดระบุอาหารที่แพ้" value={formData.foodAllergyDetail} onChange={handleInputChange} rows={3} />
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>แพ้ยาไหม? *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="hasDrugAllergy" value="false" checked={formData.hasDrugAllergy === false} onChange={handleInputChange} /> ไม่แพ้
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="hasDrugAllergy" value="true" checked={formData.hasDrugAllergy === true} onChange={handleInputChange} /> แพ้
                    </label>
                  </div>
                  {formData.hasDrugAllergy && (
                    <textarea name="drugAllergyDetail" className={styles.textarea} placeholder="โปรดระบุยาที่แพ้" value={formData.drugAllergyDetail} onChange={handleInputChange} rows={3} />
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>มีโรคประจำตัวไหม? *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="hasUnderlyingDisease" value="false" checked={formData.hasUnderlyingDisease === false} onChange={handleInputChange} /> ไม่มี
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="hasUnderlyingDisease" value="true" checked={formData.hasUnderlyingDisease === true} onChange={handleInputChange} /> มี
                    </label>
                  </div>
                  {formData.hasUnderlyingDisease && (
                    <textarea name="underlyingDiseaseDetail" className={styles.textarea} placeholder="ระบุโรคประจำตัว" value={formData.underlyingDiseaseDetail} onChange={handleInputChange} rows={3} />
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>ช่วงเวลาตรวจ *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="time" value="morning" checked={formData.time === "morning"} onChange={handleInputChange} /> ช่วงเช้า (Morning)
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="time" value="afternoon" checked={formData.time === "afternoon"} onChange={handleInputChange} /> ช่วงบ่าย (Afternoon)
                    </label>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-4 border-t">
              <button className={styles.btnBack} onClick={() => setWalkInOpen(false)}>
                ยกเลิก
              </button>
              <button className={styles.btnSubmit} onClick={handleWalkInSubmit} disabled={walkInLoading}>
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