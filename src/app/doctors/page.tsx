"use client";

import { useState } from "react";
import styles from "./doctors.module.css";

type TabType = "departments" | "doctors";

interface Doctor {
  id: number;
  name: string;
  title: string;
  department: string;
  specialty: string;
  available_days: string;
  available_time: string;
  image: string;
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "นพ.สมชาย ใจดี",
    title: "นพ.",
    department: "แผนกศัลยกรรมกระดูก",
    specialty: "กระดูกและข้อ",
    available_days: "จ อ พ",
    available_time: "08:00-12:00",
    image: "/doctors/doctor1.jpg",
  },
  {
    id: 2,
    name: "นพ.วิชัย เก่งดี",
    title: "นพ.",
    department: "แผนกอายุรกรรม",
    specialty: "โรคหัวใจและหลอดเลือด",
    available_days: "อ พ ศ",
    available_time: "09:00-12:00",
    image: "/doctors/doctor2.jpg",
  },
  {
    id: 3,
    name: "พญ.สุดา สวยงาม",
    title: "พญ.",
    department: "แผนกกันยาวรรม",
    specialty: "ฮอร์โมนและทันศรรมสตรีตรวางวัย",
    available_days: "อ พฤ ศ",
    available_time: "13:00-16:00",
    image: "/doctors/doctor3.jpg",
  },
  {
    id: 4,
    name: "พญ.มาลี รักษ์ดี",
    title: "พญ.",
    department: "แผนกจุลกรรมวอร์กรรม",
    specialty: "ผิวหลังและไสรภ์",
    available_days: "จ-ศ",
    available_time: "09:00-15:00",
    image: "/doctors/doctor4.jpg",
  },
  {
    id: 5,
    name: "นพ.ประสิทธิ์ สุขสม",
    title: "นพ.",
    department: "แผนกศัลยกรรม",
    specialty: "ศัลยกรรมทั่วไป",
    available_days: "จ อ พฤ",
    available_time: "08:00-11:00",
    image: "/doctors/doctor5.jpg",
  },
  {
    id: 6,
    name: "นพ.อารี แข็งแรง",
    title: "นพ.",
    department: "แผนกตรวจสุขภาพ",
    specialty: "เวชศาสตร์ป้องกัน",
    available_days: "อ พ ศ",
    available_time: "13:00-16:00",
    image: "/doctors/doctor6.jpg",
  },
];

const DEPARTMENTS = [
  {
    id: 1,
    name: "อายุรกรรม",
    doctorCount: 6,
    icon: "🩺",
    services: ["ไข้หวัด ไอ เจ็บคอ", "ปวดท้อง ท้องเสีย", "โรคเรื้อรัง เบาหวาน ความดัน", "ตรวจสุขภาพทั่วไป"],
  },
  {
    id: 2,
    name: "ศัลยกรรม",
    doctorCount: 4,
    icon: "🔬",
    services: ["ผ่าตัดทั่วไป", "บาดแผล แผลไฟไหม้", "เย็บแผล ตัดไหม", "ผ่าตัดไส้ติ่ง"],
  },
  {
    id: 3,
    name: "ทันตกรรม",
    doctorCount: 5,
    icon: "🦷",
    services: ["อุดฟัน ถอนฟัน", "ขูดหินปูน", "รักษารากฟัน", "จัดฟัน ฟอกสีฟัน"],
  },
  {
    id: 4,
    name: "กุมารเวชกรรม",
    doctorCount: 4,
    icon: "👶",
    services: ["ตรวจสุขภาพเด็ก", "ฉีดวัคซีน", "ตรวจพัฒนาการ", "รักษาโรคเด็ก"],
  },
  {
    id: 5,
    name: "ศัลยกรรมกระดูก",
    doctorCount: 4,
    icon: "🦴",
    services: ["กระดูกหัก ข้อเคลื่อน", "ปวดหลัง ปวดคอ", "ข้ออักเสบ", "เอ็นอักเสบ"],
  },
  {
    id: 6,
    name: "ตรวจสุขภาพ",
    doctorCount: 5,
    icon: "📋",
    services: ["ตรวจสุขภาพประจำปี", "Health Check Up", "ตรวจเลือด ปัสสาวะ", "X-Ray ตรวจหัวใจ"],
  },
];

export default function DoctorsPage() {
  const [activeTab, set_active_tab] = useState<TabType>("doctors");

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>ทีมแพทย์ผู้เชี่ยวชาญ</h1>
        <p className={styles.heroSubtitle}>แพทย์มากประสบการณ์พร้อมดูแลคุณด้วยใจ</p>
      </div>

      {/* Tabs */}
      <div className={styles.content}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "departments" ? styles.tabActive : ""}`}
            onClick={() => set_active_tab("departments")}
          >
            แผนกทั้งหมด
          </button>
          <button
            className={`${styles.tab} ${activeTab === "doctors" ? styles.tabActive : ""}`}
            onClick={() => set_active_tab("doctors")}
          >
            แพทย์ทั้งหมด
          </button>
        </div>

        {/* Departments Grid */}
        {activeTab === "departments" && (
          <div className={styles.departmentsGrid}>
            {DEPARTMENTS.map((dept) => (
              <div key={dept.id} className={styles.departmentCard}>
                <div className={styles.departmentIcon}>{dept.icon}</div>
                <h3 className={styles.departmentName}>{dept.name}</h3>
                <p className={styles.doctorCount}>แพทย์ {dept.doctorCount} ท่าน</p>
                <ul className={styles.servicesList}>
                  {dept.services.map((service, idx) => (
                    <li key={idx}>{service}</li>
                  ))}
                </ul>
                <button className={styles.detailButton}>ดูแพทย์ในแผนก</button>
              </div>
            ))}
          </div>
        )}

        {/* Doctors Grid */}
        {activeTab === "doctors" && (
          <div className={styles.doctorsGrid}>
            {MOCK_DOCTORS.map((doctor) => (
              <div key={doctor.id} className={styles.doctorCard}>
                <div className={styles.doctorImage}>
                  <div className={styles.imagePlaceholder}>
                    <span>👨‍⚕️</span>
                  </div>
                </div>
                <div className={styles.doctorInfo}>
                  <h3 className={styles.doctorName}>{doctor.name}</h3>
                  <p className={styles.doctorDepartment}>
                    {doctor.department} | {doctor.specialty}
                  </p>
                  <p className={styles.doctorSchedule}>
                    วันทำการ: {doctor.available_days} ({doctor.available_time})
                  </p>
                  <button className={styles.detailButton}>ดูรายละเอียด</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
