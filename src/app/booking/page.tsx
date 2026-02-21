"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import styles from "./booking.module.css";

const DEPT_ICONS: { [key: number]: string } = {
  1: "💚",
  2: "🔬",
  3: "👶",
  4: "🎨",
  5: "🦴",
  6: "📋",
};

// เวลานัด
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"
];

export default function BookingPage() {
  const router = useRouter();
  const { user, isLoading, load_user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());


  const [dbDepartments, setDbDepartments] = useState<any[]>([]);

  // Form data for step 3
  const [formData, setFormData] = useState({
    idNumber: "",
    title: "",
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
  });


  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.success) {
        setDbDepartments(data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (value === "true" || value === "false") {
      setFormData(prev => ({ ...prev, [name]: value === "true" }));
    } else {
      if (name === "idNumber" || name === "phone") {
        const onlyNums = value.replace(/\D/g, "");
        setFormData(prev => ({ ...prev, [name]: onlyNums }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  useEffect(() => {
    load_user();
    fetchDepartments();
  }, [load_user, fetchDepartments]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (formData.idNumber.length === 13 && formData.idNumber === user?.identification_number) {
        try {
          const response = await fetch(`/api/users/check?id=${formData.idNumber}`);

          if (response.ok) {
            const data = await response.json();

            if (data.success && data.user) {
              setFormData((prev) => ({
                ...prev,
                title: data.user.title || prev.title,
                firstName: data.user.fname || prev.firstName,
                lastName: data.user.lname || prev.lastName,
                phone: data.user.phone_number || prev.phone,
                sex: data.user.sex || prev.sex,
                birthDate: data.user.birth_date || prev.birthDate,
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else if (formData.idNumber.length === 13 && formData.idNumber !== user?.identification_number) {
        setFormData(prev => ({
          ...prev,
          title: "", firstName: "", lastName: "", phone: "", sex: "", birthDate: ""
        }));
      }
    };

    fetchUserData();
  }, [formData.idNumber, user?.identification_number]);


  // ฟังก์ชันสร้างปฏิทิน
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const formatThaiMonth = (date: Date) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const handleDeptSelect = (deptId: number) => {
    setSelectedDept(deptId);
  };

  const handleDateSelect = (date: Date) => {
    if (isDateSelectable(date)) {
      setSelectedDate(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedDept) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedDate && selectedTime) {
      setCurrentStep(3);
    } else if (currentStep === 3 && isFormValid()) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.idNumber && formData.phone &&
      formData.birthDate && formData.title && formData.sex;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleSubmit = async () => {
    const payload = {
      identificationNumber: formData.idNumber,
      time: selectedTime,
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
      title: formData.title,
      fname: formData.firstName,
      lname: formData.lastName,
      phoneNumber: formData.phone,
      sex: formData.sex,
      birthDate: formData.birthDate,
      isSmoking: formData.isSmoking,
      isDrinking: formData.isDrinking,
      hasFoodAllergy: formData.hasFoodAllergy,
      foodAllergyDetail: formData.hasFoodAllergy ? formData.foodAllergyDetail : "",
      hasDrugAllergy: formData.hasDrugAllergy,
      drugAllergyDetail: formData.hasDrugAllergy ? formData.drugAllergyDetail : "",
      hasUnderlyingDisease: formData.hasUnderlyingDisease,
      underlyingDiseaseDetail: formData.hasUnderlyingDisease ? formData.underlyingDiseaseDetail : "",
      status: "pending",
      departmentId: selectedDept
    };

    try {
      console.log("Sending Payload:", payload);

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถจองคิวได้ กรุณาลองใหม่"}`);
        return;
      }

      alert("จองคิวสำเร็จเรียบร้อยครับ!");
      console.log("Success:", data);
      router.push("/profile");

    } catch (error) {
      console.error("Fetch Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  const getDeptName = () => {
    return dbDepartments.find(d => d.dno === selectedDept)?.name || "";
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBanner}>
        <h1 className={styles.mainTitle}>จองนัดหมาย</h1>
        <p className={styles.subtitle}>จองนัดออนไลน์ ง่ายและสะดวก</p>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressSteps}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.stepActive : ""}`}>
            <div className={styles.stepCircle}>1</div>
            <span className={styles.stepLabel}>เลือกแผนก</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.stepActive : ""}`}>
            <div className={styles.stepCircle}>2</div>
            <span className={styles.stepLabel}>เลือกวันเวลา</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.stepActive : ""}`}>
            <div className={styles.stepCircle}>3</div>
            <span className={styles.stepLabel}>กรอกข้อมูล</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${currentStep >= 4 ? styles.stepActive : ""}`}>
            <div className={styles.stepCircle}>4</div>
            <span className={styles.stepLabel}>ยืนยัน</span>
          </div>
        </div>
      </div>

      <div className={styles.contentCard}>

        {/* Step 1: เลือกแผนก  */}
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>เลือกแผนกที่ต้องการ</h2>
            <p className={styles.stepDescription}>กรุณาเลือกแผนกที่คุณต้องการรับบริการ</p>
            <div className={styles.departmentGrid}>
              {dbDepartments.map((dept) => (
                <div
                  key={dept.dno}
                  className={`${styles.deptCard} ${selectedDept === dept.dno ? styles.deptCardActive : ""}`}
                  onClick={() => handleDeptSelect(dept.dno)}
                >
                  {/* 🐧 ใช้ไอคอนตาม dno [cite: 2026-02-18] */}
                  <div className={styles.deptIcon}>{DEPT_ICONS[Number(dept.dno)] || "🏥"}</div>
                  <div className={styles.deptName}>{dept.name}</div>
                </div>
              ))}
            </div>
            {dbDepartments.length === 0 && <p className={styles.loading}>กำลังโหลดรายชื่อแผนก...</p>}
          </div>
        )}

        {/* Step 2: เลือกวันและเวลา */}
        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>เลือกวันและเวลา</h2>
            <p className={styles.stepDescription}>กรุณาเลือกวันที่และเวลาที่สะดวก</p>

            <div className={styles.calendarSection}>
              <div className={styles.calendarHeader}>
                <button className={styles.monthBtn} onClick={handlePrevMonth}>-</button>
                <h3 className={styles.monthYear}>{formatThaiMonth(currentMonth)}</h3>
                <button className={styles.monthBtn} onClick={handleNextMonth}>+</button>
              </div>

              <div className={styles.calendar}>
                <div className={styles.weekdays}>
                  <div className={styles.weekday}>อา</div><div className={styles.weekday}>จ</div>
                  <div className={styles.weekday}>อ</div><div className={styles.weekday}>พ</div>
                  <div className={styles.weekday}>พฤ</div><div className={styles.weekday}>ศ</div>
                  <div className={styles.weekday}>ส</div>
                </div>

                <div className={styles.days}>
                  {getDaysInMonth(currentMonth).map((day, index) => (
                    <div
                      key={index}
                      className={`${styles.day} 
                        ${day && isDateSelectable(day) ? styles.daySelectable : styles.dayDisabled}
                        ${day && isSameDay(day, selectedDate) ? styles.daySelected : ""}`}
                      onClick={() => day && handleDateSelect(day)}
                    >
                      {day ? day.getDate() : ""}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.timeSection}>
              <h3 className={styles.sectionTitle}>เลือกเวลา</h3>
              <div className={styles.timeGrid}>
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className={`${styles.timeSlot} ${selectedTime === time ? styles.timeSlotSelected : ""}`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: กรอกข้อมูล */}
        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>กรอกข้อมูลผู้ป่วย</h2>
            <p className={styles.stepDescription}>กรุณากรอกข้อมูลให้ครบถ้วน</p>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>เลขบัตรประชาชน *</label>
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

              <div className={styles.formGroup}>
                <label className={styles.label}>ชื่อ *</label>
                <input type="text" name="firstName" className={styles.input} placeholder="ชื่อ" value={formData.firstName} onChange={handleInputChange} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>นามสกุล *</label>
                <input type="text" name="lastName" className={styles.input} placeholder="นามสกุล" value={formData.lastName} onChange={handleInputChange} />
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
                <input type="date" name="birthDate" className={styles.input} value={formData.birthDate} onChange={handleInputChange} />
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
            </div>
          </div>
        )}

        {/* Step 4: ยืนยันการจอง */}
        {currentStep === 4 && (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>ยืนยันการจองนัด</h2>
            <p className={styles.stepDescription}>กรุณาตรวจสอบข้อมูลก่อนยืนยันการจอง</p>

            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>สรุปการจองนัด</h3>
              <div className={styles.summarySection}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>แผนก</span>

                  <span className={styles.summaryValue}>
                    {DEPT_ICONS[Number(selectedDept)]} {getDeptName()}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>วันที่นัดหมาย</span>
                  <span className={styles.summaryValue}>
                    {selectedDate && selectedDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>เวลา</span>
                  <span className={styles.summaryValue}>{selectedTime} น.</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>ชื่อ-นามสกุล</span>
                  <span className={styles.summaryValue}>{formData.title}{formData.firstName} {formData.lastName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>เบอร์โทร</span>
                  <span className={styles.summaryValue}>{formData.phone}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>วันเกิด</span>
                  <span className={styles.summaryValue}>{formData.birthDate}</span>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.infoTitle}>เอกสารที่ต้องนำมา</h4>
                <ul className={styles.infoList}>
                  <li>บัตรประชาชน</li>
                  <li>บัตรสิทธิการรักษา (บัตรทอง/ประกันสังคม)</li>
                  <li>ระเบียนทั้ง QR Code</li>
                  <li>บัตรผู้ป่วย (ถ้ามี)</li>
                  <li>ผลตรวจสืบ (ถ้ามี)</li>
                </ul>
              </div>
              <div className={styles.infoSection}>
                <h4 className={styles.infoTitle}>การเตรียมตัว</h4>
                <ul className={styles.infoList}>
                  <li>มาก่อนเวลานัดอย่างน้อย 15-30 นาที</li>
                  <li>งดอาหาร 8 ชั่วโมง (สำหรับตรวจเลือด)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {currentStep > 1 && (
            <button className={styles.btnBack} onClick={handlePrevStep}>
              ย้อนกลับ
            </button>
          )}

          {currentStep < 4 ? (
            <button
              className={styles.btnNext}
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !selectedDept) ||
                (currentStep === 2 && (!selectedDate || !selectedTime)) ||
                (currentStep === 3 && !isFormValid())
              }
            >
              ถัดไป
            </button>
          ) : (
            <button className={styles.btnSubmit} onClick={handleSubmit}>
              ยืนยันการจอง
            </button>
          )}
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