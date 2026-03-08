// app/api/booking/update/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
    try {
        const { ap_id, status } = await request.json();

        // ดึงข้อมูล appointment ก่อนอัปเดต
        const apResult = await db.execute({
            sql: `SELECT a.*, d.name as department_name 
                  FROM appointments a 
                  LEFT JOIN department d ON a.departmentId = d.dno 
                  WHERE a.ap_id = ?`,
            args: [ap_id],
        });

        if (apResult.rows.length === 0) {
            return NextResponse.json({ error: "ไม่พบการนัดหมาย" }, { status: 404 });
        }

        const appointment = apResult.rows[0] as any;

        // อัปเดตสถานะ
        await db.execute({
            sql: `UPDATE appointments SET status = ? WHERE ap_id = ?`,
            args: [status, ap_id],
        });

        // แปลงวันที่เป็นภาษาไทย
        const dateObj = new Date(appointment.date);
        const thaiDate = dateObj.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        const timeLabel = appointment.time === "morning" ? "ช่วงเช้า" : "ช่วงบ่าย";
        const deptName = appointment.department_name || "ไม่ระบุ";

        // สร้าง notification ตามสถานะ 
        let notifTitle = "";
        let notifMessage = "";
        let notifType = "";

        if (status === "done") {
            notifTitle = "ยืนยันนัดหมาย";
            notifMessage = `นัดหมายของคุณแผนก${deptName} วันที่ ${thaiDate} ${timeLabel} ได้รับการยืนยันแล้ว`;
            notifType = "appointment";
        } else if (status === "cancelled" || status === "cancel") {
            notifTitle = "ยกเลิกนัดหมาย";
            notifMessage = `นัดหมายของคุณแผนก${deptName} วันที่ ${thaiDate} ${timeLabel} ถูกยกเลิกแล้ว`;
            notifType = "cancel";
        } else if (status === "completed") {
            notifTitle = "ตรวจเสร็จสิ้น";
            notifMessage = `การตรวจแผนก${deptName} ของคุณเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ`;
            notifType = "system";
        }

        // ส่ง notification ถ้ามีการเปลี่ยนสถานะที่ต้องแจ้ง
        if (notifTitle) {
            try {
                await db.execute({
                    sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                          VALUES (?, ?, ?, ?, ?)`,
                    args: [
                        appointment.identification_number,
                        notifTitle,
                        notifMessage,
                        notifType,
                        ap_id,
                    ],
                });
            } catch (notifError) {
                console.error("Notification error:", notifError);
            }
        }

        // ถ้ายืนยันนัด เช็คว่าเป็นคิวแรกหรือป่าว ถ้าใช่ก็ส่งแจ้งเตือน
        if (status === "done") {
            try {
                // นับจำนวนคิวที่ done แล้วก่อนหน้า ในวันเดียวกัน แผนกเดียวกัน ช่วงเดียวกัน
                const countResult = await db.execute({
                    sql: `SELECT COUNT(*) as cnt FROM appointments 
                          WHERE date = ? AND departmentId = ? AND time = ? AND status = 'done' AND ap_id < ?`,
                    args: [appointment.date, appointment.departmentId, appointment.time, ap_id],
                });
                
                const countBefore = Number((countResult.rows[0] as any)?.cnt || 0);
                const deptLetter = String.fromCharCode(64 + (appointment.departmentId || 1));
                const queueCode = `${deptLetter}${String(ap_id).padStart(2, '0')}`;
                
                // ถ้าไม่มีคิวก่อนหน้า ผู้ใช้เป็นคิวแรก ส่งแจ้งเตือน
                if (countBefore === 0) {
                    await db.execute({
                        sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                              VALUES (?, ?, ?, ?, ?)`,
                        args: [
                            appointment.identification_number,
                            "🔔 ถึงคิวของคุณแล้ว!",
                            `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${queueCode}`,
                            "queue",
                            ap_id,
                        ],
                    });
                } 
                // ถ้ามีคิวก่อนหน้า 1 คน เป็นคนถัดไป
                else if (countBefore === 1) {
                    await db.execute({
                        sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                              VALUES (?, ?, ?, ?, ?)`,
                        args: [
                            appointment.identification_number,
                            "🔔 เตรียมตัว! คุณอยู่ลำดับถัดไป",
                            `คิว ${queueCode} แผนก${deptName} กรุณาเตรียมตัวรอเรียก`,
                            "queue",
                            ap_id,
                        ],
                    });
                }

                // หาคิวถัดไป (คนที่ done แล้วหลังคนปัจจุบัน)
                const nextQueueResult = await db.execute({
                    sql: `SELECT * FROM appointments 
                          WHERE date = ? AND departmentId = ? AND time = ? AND status = 'done' AND ap_id > ?
                          ORDER BY ap_id ASC LIMIT 1`,
                    args: [appointment.date, appointment.departmentId, appointment.time, ap_id],
                });

                if (nextQueueResult.rows.length > 0) {
                    const nextPatient = nextQueueResult.rows[0] as any;
                    const nextQueueCode = `${deptLetter}${String(nextPatient.ap_id).padStart(2, '0')}`;

                    await db.execute({
                        sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                              VALUES (?, ?, ?, ?, ?)`,
                        args: [
                            nextPatient.identification_number,
                            "🔔 เตรียมตัว! คุณอยู่ลำดับถัดไป",
                            `คิว ${nextQueueCode} แผนก${deptName} กรุณาเตรียมตัวรอเรียก`,
                            "queue",
                            nextPatient.ap_id,
                        ],
                    });
                }
            } catch (queueNotifError) {
                console.error("Queue notification error:", queueNotifError);
            }
        }

        // ถ้าตรวจเสร็จ (completed) >แจ้งคิวถัดไปว่า "ถึงคิว" และคิวถัดไปอีกว่า "เตรียมตัว"
        if (status === "completed") {
            try {
                const deptLetter = String.fromCharCode(64 + (appointment.departmentId || 1));

                // หาคิวถัดไปที่ยัง done (ยังไม่ completed)
                const nextQueueResult = await db.execute({
                    sql: `SELECT * FROM appointments 
                          WHERE date = ? AND departmentId = ? AND time = ? AND status = 'done' AND ap_id > ?
                          ORDER BY ap_id ASC LIMIT 2`,
                    args: [appointment.date, appointment.departmentId, appointment.time, ap_id],
                });

                // คนแรก = ถึงคิว
                if (nextQueueResult.rows.length > 0) {
                    const nextPatient = nextQueueResult.rows[0] as any;
                    const nextQueueCode = `${deptLetter}${String(nextPatient.ap_id).padStart(2, '0')}`;

                    await db.execute({
                        sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                              VALUES (?, ?, ?, ?, ?)`,
                        args: [
                            nextPatient.identification_number,
                            "🔔 ถึงคิวของคุณแล้ว!",
                            `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${nextQueueCode}`,
                            "queue",
                            nextPatient.ap_id,
                        ],
                    });
                }

                // คนที่สอง = เตรียมตัว
                if (nextQueueResult.rows.length > 1) {
                    const secondPatient = nextQueueResult.rows[1] as any;
                    const secondQueueCode = `${deptLetter}${String(secondPatient.ap_id).padStart(2, '0')}`;

                    await db.execute({
                        sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                              VALUES (?, ?, ?, ?, ?)`,
                        args: [
                            secondPatient.identification_number,
                            "🔔 เตรียมตัว! คุณอยู่ลำดับถัดไป",
                            `คิว ${secondQueueCode} แผนก${deptName} กรุณาเตรียมตัวรอเรียก`,
                            "queue",
                            secondPatient.ap_id,
                        ],
                    });
                }
            } catch (completedNotifError) {
                console.error("Completed notification error:", completedNotifError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}