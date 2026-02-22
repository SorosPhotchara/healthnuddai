"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/lib/auth";
import styles from "./booking.module.css";

const DEPARTMENTS = [
  { id: 1, name: "อายุรกรรม", icon: "💚", color: "#4ade80" },
  { id: 2, name: "ศัลยกรรม", icon: "🔬", color: "#60a5fa" },
  { id: 3, name: "กุมารเวช", icon: "🚼", color: "#f472b6" },
  { id: 4, name: "ศัลยกรรมตกแต่ง", icon: "🎨", color: "#fb923c" },
  { id: 5, name: "กระดูก", icon: "🦴", color: "#a78bfa" },
  { id: 6, name: "ตรวจสุขภาพ", icon: "📋", color: "#22d3ee" },
];

const PERIODS = [
  {
    id: "morning",
    label: "ช่วงเช้า",
    icon: "☀️",
    timeRange: "09:00 – 12:00 น.",
    slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
  },
  {
    id: "afternoon",
    label: "ช่วงบ่าย",
    icon: "🌤️",
    timeRange: "13:00 – 16:00 น.",
    slots: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"],
  },
];

const THAI_MONTHS_FULL = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const THAI_MONTHS_SHORT = [
  "ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.",
  "ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค.",
];

const quotaCache: Record<string, { max: number; booked: number }> = {};
function getQuota(deptId: number, dateStr: string, periodId: string) {
  const key = `${deptId}-${dateStr}-${periodId}`;
  if (!quotaCache[key]) {
    const max = Math.floor(Math.random() * 4) + 5;
    const booked = Math.floor(Math.random() * max);
    quotaCache[key] = { max, booked };
  }
  return quotaCache[key];
}
function dateToStr(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// =============================================
// BirthDatePicker — custom calendar popup
// ค่าที่ส่งออกเป็น dd/mm/yyyy (ค.ศ.)
// =============================================
function BirthDatePicker({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "month" | "year">("day");

  // เริ่มหน้าปฏิทินที่ปีย้อนหลัง 25 ปี
  const defaultNav = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  const [nav, setNav] = useState<Date>(
    value ? new Date(value.getFullYear(), value.getMonth(), 1) : defaultNav()
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  // ปิด popup เมื่อคลิกข้างนอก
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("day");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const daysInMonth = new Date(nav.getFullYear(), nav.getMonth() + 1, 0).getDate();
  const firstDow = new Date(nav.getFullYear(), nav.getMonth(), 1).getDay();
  const currentBEYear = new Date().getFullYear() + 543;
  const yearList = Array.from({ length: 100 }, (_, i) => currentBEYear - i);

  // แสดงผลบนปุ่ม trigger — วันที่ภาษาไทย
  const triggerLabel = value
    ? `${value.getDate().toString().padStart(2, "0")}/${(value.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${value.getFullYear()}  (${value.getDate()} ${THAI_MONTHS_FULL[value.getMonth()]} ${value.getFullYear() + 543})`
    : null;

  const handleDayClick = (day: number) => {
    const selected = new Date(nav.getFullYear(), nav.getMonth(), day);
    onChange(selected);
    setOpen(false);
    setMode("day");
  };

  const isSel = (day: number) =>
    value &&
    value.getDate() === day &&
    value.getMonth() === nav.getMonth() &&
    value.getFullYear() === nav.getFullYear();

  const beYear = nav.getFullYear() + 543;

  return (
    <div className={styles.bpWrapper} ref={wrapRef}>

      {/* ── Trigger ── */}
      <button
        type="button"
        className={`${styles.bpTrigger} ${value ? styles.bpTriggerFilled : ""}`}
        onClick={() => { setOpen(o => !o); setMode("day"); }}
      >
        <span className={styles.bpTriggerIcon}>📅</span>
        <span className={value ? styles.bpTriggerValue : styles.bpTriggerPlaceholder}>
          {triggerLabel ?? "เลือกวันเกิด"}
        </span>
        <span className={styles.bpTriggerChevron}>{open ? "▲" : "▼"}</span>
      </button>

      {/* ── Popup ── */}
      {open && (
        <div className={styles.bpPopup}>

          {/* Header */}
          <div className={styles.bpHeader}>
            {mode === "day" && (
              <button type="button" className={styles.bpNavBtn}
                onClick={() => setNav(new Date(nav.getFullYear(), nav.getMonth() - 1, 1))}>
                ‹
              </button>
            )}

            <div className={styles.bpHeaderCenter}>
              {mode === "day" && (
                <>
                  <button type="button" className={styles.bpHeaderBtn}
                    onClick={() => setMode("month")}>
                    {THAI_MONTHS_FULL[nav.getMonth()]}
                  </button>
                  <button type="button" className={styles.bpHeaderBtn}
                    onClick={() => setMode("year")}>
                    {beYear}
                  </button>
                </>
              )}
              {mode === "month" && (
                <span className={styles.bpModeTitle}>เลือกเดือน — {beYear}</span>
              )}
              {mode === "year" && (
                <span className={styles.bpModeTitle}>เลือกปี (พ.ศ.)</span>
              )}
            </div>

            {mode === "day" ? (
              <button type="button" className={styles.bpNavBtn}
                onClick={() => setNav(new Date(nav.getFullYear(), nav.getMonth() + 1, 1))}>
                ›
              </button>
            ) : (
              <button type="button" className={styles.bpCloseBtn}
                onClick={() => setMode("day")}>
                ✕
              </button>
            )}
          </div>

          {/* ── Day grid ── */}
          {mode === "day" && (
            <>
              <div className={styles.bpWeekdays}>
                {["อา","จ","อ","พ","พฤ","ศ","ส"].map(d => (
                  <div key={d} className={styles.bpWeekday}>{d}</div>
                ))}
              </div>
              <div className={styles.bpDays}>
                {Array.from({ length: firstDow }).map((_, i) => <div key={`g${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`${styles.bpDay} ${isSel(day) ? styles.bpDaySelected : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Month grid ── */}
          {mode === "month" && (
            <div className={styles.bpMonthGrid}>
              {THAI_MONTHS_SHORT.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.bpMonthBtn} ${nav.getMonth() === idx ? styles.bpMonthSelected : ""}`}
                  onClick={() => { setNav(new Date(nav.getFullYear(), idx, 1)); setMode("day"); }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* ── Year list ── */}
          {mode === "year" && (
            <div className={styles.bpYearList}>
              {yearList.map(y => (
                <button
                  key={y}
                  type="button"
                  className={`${styles.bpYearBtn} ${nav.getFullYear() + 543 === y ? styles.bpYearSelected : ""}`}
                  onClick={() => { setNav(new Date(y - 543, nav.getMonth(), 1)); setMode("month"); }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Footer hint */}
          {mode === "day" && (
            <div className={styles.bpFooter}>
              คลิกชื่อเดือน หรือปี เพื่อเปลี่ยนเร็ว
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// Main Page
// =============================================
export default function BookingPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [birthDateObj, setBirthDateObj] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    idNumber: "",
    phone: "",
    birthDate: "",   // เก็บเป็น "dd/mm/yyyy"
    prefix: "",
    sex: "",
    weight: "",
    height: "",
    foodAllergy: "",
    foodAllergyDetail: "",
    drugAllergy: "",
    drugAllergyDetail: "",
    disease: "",
    diseaseDetail: "",
  });

  const handleBirthSelect = (date: Date) => {
    setBirthDateObj(date);
    const dd = date.getDate().toString().padStart(2, "0");
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    setFormData(prev => ({ ...prev, birthDate: `${dd}/${mm}/${yyyy}` }));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = new Date(year, month, 1).getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  const formatThaiMonth = (date: Date) =>
    `${THAI_MONTHS_FULL[date.getMonth()]} ${date.getFullYear() + 543}`;

  const formatThaiDate = (date: Date) =>
    `${date.getDate()} ${THAI_MONTHS_FULL[date.getMonth()]} ${date.getFullYear() + 543}`;

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date(); today.setHours(0,0,0,0);
    return date >= today;
  };

  const isFormValid = () =>
    formData.firstName && formData.idNumber && formData.phone &&
    formData.birthDate && formData.prefix && formData.sex;

  const handleNextStep = () => {
    if (currentStep === 1 && selectedDept) setCurrentStep(2);
    else if (currentStep === 2 && selectedDate && selectedPeriod) setCurrentStep(3);
    else if (currentStep === 3 && isFormValid()) setCurrentStep(4);
  };
  const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async () => {
    console.log({ department: selectedDept, date: selectedDate, period: selectedPeriod, formData });
    router.push("/profile");
  };

  const getDeptName = () => DEPARTMENTS.find(d => d.id === selectedDept)?.name || "";
  const getPeriodLabel = () => PERIODS.find(p => p.id === selectedPeriod)?.label || "";

  const periodQuotas = useMemo(() => {
    if (!selectedDate || !selectedDept) return {};
    const dateStr = dateToStr(selectedDate);
    return Object.fromEntries(PERIODS.map(p => [p.id, getQuota(selectedDept, dateStr, p.id)]));
  }, [selectedDate, selectedDept]);

  return (
    <div className={styles.container}>
      <div className={styles.headerBanner}>
        <h1 className={styles.mainTitle}>จองนัดหมาย</h1>
        <p className={styles.subtitle}>จองนัดออนไลน์ ง่ายและสะดวก</p>
      </div>

      {/* Progress */}
      <div className={styles.progressContainer}>
        <div className={styles.progressSteps}>
          {[{ n:1,label:"เลือกแผนก" },{ n:2,label:"เลือกวันเวลา" },{ n:3,label:"กรอกข้อมูล" },{ n:4,label:"ยืนยัน" }].map((s,i,arr) => (
            <div key={s.n} style={{ display:"flex", alignItems:"center" }}>
              <div className={`${styles.step} ${currentStep >= s.n ? styles.stepActive : ""}`}>
                <div className={styles.stepCircle}>{s.n}</div>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.contentCard}>

        {/* ── Step 1 ── */}
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>เลือกแผนกที่ต้องการ</h2>
            <p className={styles.stepDescription}>กรุณาเลือกแผนกที่คุณต้องการรับบริการ</p>
            <div className={styles.departmentGrid}>
              {DEPARTMENTS.map(dept => (
                <div
                  key={dept.id}
                  className={`${styles.deptCard} ${selectedDept === dept.id ? styles.deptCardActive : ""}`}
                  onClick={() => { setSelectedDept(dept.id); setSelectedPeriod(null); }}
                >
                  <div className={styles.deptIcon}>{dept.icon}</div>
                  <div className={styles.deptName}>{dept.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>เลือกวันและเวลา</h2>
            <p className={styles.stepDescription}>กรุณาเลือกวันที่และช่วงเวลาที่สะดวก</p>

            <div className={styles.calendarSection}>
              <div className={styles.calendarHeader}>
                <button className={styles.monthBtn} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))}>‹</button>
                <h3 className={styles.monthYear}>{formatThaiMonth(currentMonth)}</h3>
                <button className={styles.monthBtn} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))}>›</button>
              </div>
              <div className={styles.calendar}>
                <div className={styles.weekdays}>
                  {["อา","จ","อ","พ","พฤ","ศ","ส"].map(d => <div key={d} className={styles.weekday}>{d}</div>)}
                </div>
                <div className={styles.days}>
                  {getDaysInMonth(currentMonth).map((day, idx) => (
                    <div
                      key={idx}
                      className={`${styles.day} ${day && isDateSelectable(day) ? styles.daySelectable : styles.dayDisabled} ${day && isSameDay(day, selectedDate) ? styles.daySelected : ""}`}
                      onClick={() => { if (day && isDateSelectable(day)) { setSelectedDate(day); setSelectedPeriod(null); } }}
                    >
                      {day ? day.getDate() : ""}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.timeSection}>
              <h3 className={styles.sectionTitle}>เลือกช่วงเวลา</h3>
              {!selectedDate ? (
                <p className={styles.selectDateFirst}>กรุณาเลือกวันที่ก่อน</p>
              ) : (
                <div className={styles.periodGrid}>
                  {PERIODS.map(period => {
                    const quota = periodQuotas[period.id] || { max:0, booked:0 };
                    const remaining = quota.max - quota.booked;
                    const isFull = remaining <= 0;
                    const isSelected = selectedPeriod === period.id;
                    return (
                      <div
                        key={period.id}
                        className={`${styles.periodCard} ${isSelected ? styles.periodCardSelected : ""} ${isFull ? styles.periodCardFull : ""}`}
                        onClick={() => { if (!isFull) setSelectedPeriod(period.id); }}
                      >
                        <div className={styles.periodIcon}>{period.icon}</div>
                        <div className={styles.periodLabel}>{period.label}</div>
                        <div className={styles.periodTime}>{period.timeRange}</div>
                        <div className={styles.periodSlots}>{period.slots.join(" · ")}</div>
                        <div className={`${styles.periodAvailability} ${isFull ? styles.periodFull : ""}`}>
                          {isFull ? "🔴 เต็มแล้ว" : `🟢 ว่าง ${remaining}/${quota.max} คิว`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>กรอกข้อมูลผู้ป่วย</h2>
            <p className={styles.stepDescription}>กรุณากรอกข้อมูลให้ครบถ้วน</p>
            <div className={styles.form}>

              <div className={styles.formGroup}>
                <label className={styles.label}>คำนำหน้า *</label>
                <div className={styles.radioGroup}>
                  {["นาย","นาง","นางสาว"].map(v => (
                    <label key={v} className={styles.radioLabel}>
                      <input type="radio" name="prefix" value={v}
                        checked={formData.prefix === v}
                        onChange={e => setFormData({...formData, prefix: e.target.value})} /> {v}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>ชื่อ-นามสกุล *</label>
                <input type="text" className={styles.input} placeholder="ชื่อ-นามสกุล"
                  value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>เลขบัตรประชาชน *</label>
                <input type="text" className={styles.input} placeholder="0-0000-00000-00-0"
                  value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>เบอร์โทรศัพท์ *</label>
                <input type="tel" className={styles.input} placeholder="000-000-0000"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              {/* ✅ Custom Date Picker */}
              <div className={styles.formGroup}>
                <label className={styles.label}>วัน/เดือน/ปีเกิด *</label>
                <BirthDatePicker value={birthDateObj} onChange={handleBirthSelect} />
                {formData.birthDate && (
                  <div className={styles.bpSelectedHint}>
                    📌 ค่าที่บันทึก: <strong>{formData.birthDate}</strong>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>เพศ *</label>
                <div className={styles.radioGroup}>
                  {["ชาย","หญิง"].map(v => (
                    <label key={v} className={styles.radioLabel}>
                      <input type="radio" name="sex" value={v}
                        checked={formData.sex === v}
                        onChange={e => setFormData({...formData, sex: e.target.value})} /> {v}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroupHalf}>
                  <label className={styles.label}>น้ำหนัก (กก.) *</label>
                  <input type="text" className={styles.input} placeholder="น้ำหนัก"
                    value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>
                <div className={styles.formGroupHalf}>
                  <label className={styles.label}>ส่วนสูง (ซม.) *</label>
                  <input type="text" className={styles.input} placeholder="ส่วนสูง"
                    value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroupHalf}>
                  <label className={styles.label}>สูบบุหรี่ไหม? *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}><input type="radio" name="smoke" value="สูบ" /> สูบ</label>
                    <label className={styles.radioLabel}><input type="radio" name="smoke" value="ไม่สูบ" /> ไม่สูบ</label>
                  </div>
                </div>
                <div className={styles.formGroupHalf}>
                  <label className={styles.label}>ดื่มเหล้าไหม? *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}><input type="radio" name="drink" value="ดื่ม" /> ดื่ม</label>
                    <label className={styles.radioLabel}><input type="radio" name="drink" value="ไม่ดื่ม" /> ไม่ดื่ม</label>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>แพ้อาหารไหม? *</label>
                <div className={styles.radioGroup}>
                  {["ไม่แพ้","แพ้"].map(v => (
                    <label key={v} className={styles.radioLabel}>
                      <input type="radio" name="foodAllergy" value={v}
                        checked={formData.foodAllergy === v}
                        onChange={e => setFormData({...formData, foodAllergy: e.target.value, foodAllergyDetail: ""})} /> {v}
                    </label>
                  ))}
                </div>
                {formData.foodAllergy === "แพ้" && (
                  <textarea className={styles.textarea} placeholder="โปรดระบุอาหารที่แพ้"
                    value={formData.foodAllergyDetail}
                    onChange={e => setFormData({...formData, foodAllergyDetail: e.target.value})} rows={3} />
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>แพ้ยาไหม? *</label>
                <div className={styles.radioGroup}>
                  {["ไม่แพ้","แพ้"].map(v => (
                    <label key={v} className={styles.radioLabel}>
                      <input type="radio" name="drugAllergy" value={v}
                        checked={formData.drugAllergy === v}
                        onChange={e => setFormData({...formData, drugAllergy: e.target.value, drugAllergyDetail: ""})} /> {v}
                    </label>
                  ))}
                </div>
                {formData.drugAllergy === "แพ้" && (
                  <textarea className={styles.textarea} placeholder="โปรดระบุยาที่แพ้"
                    value={formData.drugAllergyDetail}
                    onChange={e => setFormData({...formData, drugAllergyDetail: e.target.value})} rows={3} />
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>มีโรคประจำตัวไหม? *</label>
                <div className={styles.radioGroup}>
                  {["ไม่มี","มี"].map(v => (
                    <label key={v} className={styles.radioLabel}>
                      <input type="radio" name="disease" value={v}
                        checked={formData.disease === v}
                        onChange={e => setFormData({...formData, disease: e.target.value, diseaseDetail: ""})} /> {v}
                    </label>
                  ))}
                </div>
                {formData.disease === "มี" && (
                  <textarea className={styles.textarea} placeholder="โปรดระบุโรคประจำตัว"
                    value={formData.diseaseDetail}
                    onChange={e => setFormData({...formData, diseaseDetail: e.target.value})} rows={3} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4 ── */}
        {currentStep === 4 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>ยืนยันการจองนัด</h2>
            <p className={styles.stepDescription}>กรุณาตรวจสอบข้อมูลก่อนยืนยันการจอง</p>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>สรุปการจองนัด</h3>
              <div className={styles.summarySection}>
                {[
                  ["แผนก", getDeptName()],
                  ["วันที่นัด", selectedDate ? formatThaiDate(selectedDate) : ""],
                  ["ช่วงเวลา", getPeriodLabel()],
                  ["ชื่อ", `${formData.prefix}${formData.firstName}`],
                  ["วันเกิด", formData.birthDate],
                  ["เบอร์โทร", formData.phone],
                  ["เลขบัตรประชาชน", formData.idNumber],
                ].map(([label, value]) => (
                  <div key={label} className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>{label}</span>
                    <span className={styles.summaryValue}>{value}</span>
                  </div>
                ))}
              </div>
              <div className={styles.infoSection}>
                <h4 className={styles.infoTitle}>เอกสารที่ต้องนำมา</h4>
                <ul className={styles.infoList}>
                  <li>บัตรประชาชน</li>
                  <li>บัตรสิทธิการรักษา (บัตรทอง/ประกันสังคม)</li>
                  <li>บัตรผู้ป่วย (ถ้ามี)</li>
                  <li>ผลตรวจเก่า (ถ้ามี)</li>
                </ul>
              </div>
              <div className={styles.infoSection}>
                <h4 className={styles.infoTitle}>การเตรียมตัว</h4>
                <ul className={styles.infoList}>
                  <li>มาก่อนเวลานัดอย่างน้อย 15–30 นาที</li>
                  <li>งดอาหาร 8 ชั่วโมง (สำหรับตรวจเลือด)</li>
                </ul>
              </div>
              <div className={styles.infoSection}>
                <h4 className={styles.infoTitle}>นโยบายการยกเลิก/เลื่อนนัด</h4>
                <ul className={styles.infoList}>
                  <li>ยกเลิกหรือเลื่อนนัดได้ก่อน 24 ชั่วโมง</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {currentStep > 1 && (
            <button className={styles.btnBack} onClick={handlePrevStep}>ย้อนกลับ</button>
          )}
          {currentStep < 4 ? (
            <button
              className={styles.btnNext}
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !selectedDept) ||
                (currentStep === 2 && (!selectedDate || !selectedPeriod)) ||
                (currentStep === 3 && !isFormValid())
              }
            >
              ถัดไป
            </button>
          ) : (
            <button className={styles.btnSubmit} onClick={handleSubmit}>ยืนยันการจอง</button>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <p>© 2026 Software Development | สุขภาพนัดได้</p>
        <p>Present by Group 3</p>
      </footer>
    </div>
  );
}