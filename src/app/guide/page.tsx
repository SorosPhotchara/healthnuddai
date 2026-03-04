"use client";

import { useState } from "react";
import styles from "./guide.module.css";

const BOOKING_STEPS = [
  {
    id: 1,
    title: "เลือกแผนกที่ต้องการ",
    description:
      'คลิกที่เมนู "จองนัด" จากนั้นเลือกแผนกที่ต้องการพบแพทย์ เช่น อายุรกรรม, กันยทรรม, กุมารเวชกรรม หรือพิมพ์ค้นหาชื่อแผนกได้เลย',
  },
  {
    id: 2,
    title: "เลือกวันและเวลา",
    description:
      "ดูปฏิทินวันที่ว่าง (สีเขียว = ว่าง, สีเทา = เต็ม) จากนั้นเลือกช่วงเวลาที่สะดวก ระบบจะแสดงจำนวนคิวที่เหลือในช่วงเวลานั้น",
  },
  {
    id: 3,
    title: "กรอกข้อมูลผู้ป่วย",
    description:
      "กรอกข้อมูล: ชื่อ-นามสกุล, เลขบัตรประชาชน 13 หลัก, เบอร์โทรศัพท์, อีเมล (สำหรับรับรหัสนัด), และอาการเบื้องต้น (ถ้ามี)",
  },
  {
    id: 4,
    title: "ยืนยันการจอง",
    description:
      'ตรวจสอบข้อมูลให้ถูกต้อง ติ๊กยอมรับเงื่อนไข แล้วกดปุ่ม "ยืนยันการจอง"',
  },
  {
    id: 5,
    title: "รับรหัสนัด",
    description:
      "ระบบจะแสดงรหัสนัด เช่น Q-2024010915 คุณสามารถ Screenshot หรือบันทึกไว้",
  },
];

const MANAGEMENT_ITEMS = [
  // {
  //   id: "check-queue",
  //   title: "วิธีตรวจสอบคิวของฉัน",
  //   content: [
  //     '1.คลิกเมนู "ตรวจสอบนัด"',
  //     "2.กรอก รหัสนัด + เบอร์โทรศัพท์",
  //     '3.กดปุ่ม "ค้นหา"',
  //     "4.ระบบจะแสดง: วันที่และเวลานัด, ชื่อแพทย์และแผนก, ห้องตรวจ, สถานะการนัด",
  //   ],
  // },
  {
    id: "cancel",
    title: "วิธียกเลิกหรือเลื่อนนัด",
    content: [
      "1.เข้าสู่หน้าตรวจสอบนัด",
      "2.ค้นหานัดที่ต้องการ",
      '3.กดปุ่ม "ยกเลิกนัด" หรือ "เลื่อนนัด"',
      "4.เลือกวันและเวลาใหม่ (กรณีเลื่อนนัด)",
    ],
  },
  {
    id: "realtime",
    title: "วิธีดูคิวเรียลไทม์",
    content: [
      '1.คลิกเมนู "คิวเรียลไทม์"',
      "2.เลือกแผนกที่ต้องการดู",
      "3.ระบบจะแสดงคิวปัจจุบันและคิวที่รอ",
    ],
  },
];

const PREPARATION_ITEMS = [
  {
    id: "documents",
    title: "เอกสารและสิ่งที่ต้องเตรียม",
    content: [
      "• บัตรประชาชน หรือบัตรที่ราชการออกให้",
      "• บัตรนัดพบแพทย์ หรือรหัสนัด",
      "• ประวัติการรักษาเดิม (ถ้ามี)",
      "• ยาที่ใช้ประจำ (ถ้ามี)",
    ],
  },
];

const FAQ_ITEMS = [
  {
    id: "advance",
    title: "จองล่วงหน้าได้กี่วัน?",
    content: "สามารถจองล่วงหน้าได้สูงสุด 30 วัน",
  },
  {
    id: "multiple",
    title: "จองได้กี่นัดพร้อมกัน?",
    content: "สามารถจองได้สูงสุด 3 นัดพร้อมกัน ต่อ 1 ผู้ป่วย",
  },
  {
    id: "late",
    title: "ถ้ามาสายจะเป็นอย่างไร?",
    content:
      "หากมาสายเกิน 30 นาที การนัดจะถูกยกเลิกอัตโนมัติ กรุณาจองนัดใหม่",
  },
  {
    id: "forgot",
    title: "ลืมรหัสนัดทำอย่างไร?",
    content:
      "กรุณาติดต่อเคาน์เตอร์ประชาสัมพันธ์ หรือโทร 02-xxx-xxxx พร้อมแจ้งเลขบัตรประชาชน",
  },
];

export default function GuidePage() {
  const [openManagement, set_open_management] = useState<string | null>(
    "check-queue"
  );
  const [openPreparation, set_open_preparation] = useState<string | null>(null);
  const [openFaq, set_open_faq] = useState<string | null>(null);

  const toggle_management = (id: string) => {
    set_open_management(openManagement === id ? null : id);
  };

  const toggle_preparation = (id: string) => {
    set_open_preparation(openPreparation === id ? null : id);
  };

  const toggle_faq = (id: string) => {
    set_open_faq(openFaq === id ? null : id);
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>คู่มือการใช้งาน</h1>
        <p className={styles.heroSubtitle}>
          คู่มือครบครัน สำหรับการใช้งานระบบจองนัดโรงพยาบาล
        </p>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* วิธีการจองนัดหมาย */}
        <h2 className={styles.sectionTitle}>วิธีการจองนัดหมาย</h2>
        <div className={styles.stepsCard}>
          <h3 className={styles.stepsHeader}>ขั้นตอนการจองทั้งหมด</h3>
          <div className={styles.stepsList}>
            {BOOKING_STEPS.map((step) => (
              <div key={step.id} className={styles.stepItem}>
                <div className={styles.stepNumber}>{step.id}</div>
                <div className={styles.stepContent}>
                  <h4 className={styles.stepTitle}>{step.title}</h4>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <br></br>
        
        {/* การตรวจสอบและจัดการนัด */}
        <h2 className={styles.sectionTitle}>การตรวจสอบและจัดการนัด</h2>
        <div className={styles.stepsCard}>
          <div className={styles.accordionList}>
            {MANAGEMENT_ITEMS.map((item) => (
              <div key={item.id} className={styles.accordionItem}>
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggle_management(item.id)}
                >
                  <span>{item.title}</span>
                  <span
                    className={`${styles.accordionIcon} ${openManagement === item.id ? styles.accordionIconOpen : ""}`}
                  >
                    ▼
                  </span>
                </button>
                {openManagement === item.id && (
                  <div className={styles.accordionContent}>
                    {item.content.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* การเตรียมตัวก่อนมา */}
        <h2 className={styles.sectionTitle}>การเตรียมตัวก่อนมา</h2>
        <div className={styles.stepsCard}>
          <div className={styles.accordionList}>
            {PREPARATION_ITEMS.map((item) => (
              <div key={item.id} className={styles.accordionItem}>
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggle_preparation(item.id)}
                >
                  <span>{item.title}</span>
                  <span
                    className={`${styles.accordionIcon} ${openPreparation === item.id ? styles.accordionIconOpen : ""}`}
                  >
                    ▼
                  </span>
                </button>
                {openPreparation === item.id && (
                  <div className={styles.accordionContent}>
                    {item.content.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* คำถามที่พบบ่อย */}
        <h2 className={styles.sectionTitle}>คำถามที่พบบ่อย</h2>
        <div className={styles.stepsCard}>
          <div className={styles.accordionList}>
            {FAQ_ITEMS.map((item) => (
              <div key={item.id} className={styles.accordionItem}>
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggle_faq(item.id)}
                >
                  <span>{item.title}</span>
                  <span
                    className={`${styles.accordionIcon} ${openFaq === item.id ? styles.accordionIconOpen : ""}`}
                  >
                    ▼
                  </span>
                </button>
                {openFaq === item.id && (
                  <div className={styles.accordionContent}>
                    <p>{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ติดต่อสอบถาม */}
        <h2 className={styles.sectionTitle}>ติดต่อสอบถาม</h2>
        <div className={styles.stepsCard}>
          <div className={styles.contactInfo}>
            <p>📞 <strong>โทรศัพท์:</strong> 02-xxx-xxxx</p>
            <p>📧 <strong>อีเมล:</strong> contact@hospital.com</p>
            <p>🕐 <strong>เวลาทำการ:</strong> จันทร์ - ศุกร์ 08:00 - 17:00 น.</p>
            <p>📍 <strong>ที่อยู่:</strong> 123 ถนนxxx แขวงxxx เขตxxx กรุงเทพฯ 10xxx</p>
          </div>
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
