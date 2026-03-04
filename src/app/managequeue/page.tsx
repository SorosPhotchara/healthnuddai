"use client";
import React, { useState } from "react";
import styles from "./staffqueue.module.css";

interface Patient {
  id: string;
  name: string;
  token: string;
}

const StaffQueuePage: React.FC = () => {
  // สมมติข้อมูลคิว
  const [currentQueue, setCurrentQueue] = useState<string>("204");
  const [waitingList, setWaitingList] = useState<Patient[]>([
    { id: "1", name: "นายสมชาย รักดี", token: "205" },
    { id: "2", name: "นางสาวใจดี ขยัน", token: "206" },
    { id: "3", name: "นายปัญญา เรียนเก่ง", token: "207" },
    { id: "4", name: "นางวันดี มีสุข", token: "208" },
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        <div className={styles.displaySection}>
          <span className={styles.deptTitle}>แผนกอายุรกรรม</span>
          <p className={styles.statusLabel}>กำลังให้บริการคิวหมายเลข</p>

          <div className={styles.tokenBox}>
            <span className={styles.tokenNumber}>{currentQueue}</span>
          </div>

          <div className="text-center w-full max-w-sm mt-4 p-4 bg-[#F8FAFC] rounded-xl border">
            <p className="text-gray-500 font-medium">
              Serving Time:{" "}
              <span className="font-bold text-[#10B981] text-2xl">
                00:05:12
              </span>
            </p>
          </div>
        </div>

        <div className={styles.actionSection}>
          <button className={`${styles.btnAction} ${styles.btnNext}`}>
            เรียกคิวถัดไป (Next)
          </button>

          <button className={`${styles.btnAction} ${styles.btnRecall}`}>
            เรียกซ้ำ (Recall)
          </button>

          <button className={`${styles.btnAction} ${styles.btnSkip}`}>
            ข้ามคิว (Skip)
          </button>

          <button className={`${styles.btnAction} ${styles.btnComplete}`}>
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
            {waitingList.map((patient, index) => (
              <div
                key={patient.id}
                className={`${styles.patientItem} ${index === 0 ? styles.nextHighlight : ""}`}
              >
                <div>
                  <p className="font-bold text-gray-800 text-lg">
                    {patient.name}
                  </p>
                  <p className="text-sm text-gray-400">ID: {patient.id}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-gray-400 font-bold"># {index + 1}</span>
                  <p className="text-[#5DB996] font-black text-2xl bg-white px-4 py-2 rounded-full shadow-inner">
                    {patient.token}
                  </p>
                </div>
              </div>
            ))}
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
