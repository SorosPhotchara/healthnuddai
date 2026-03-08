import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      identificationNumber,
      time,
      date,
      title,
      fname,
      lname,
      phoneNumber,
      sex,
      birthDate,
      isSmoking,
      isDrinking,
      hasFoodAllergy,
      foodAllergyDetail,
      hasDrugAllergy,
      drugAllergyDetail,
      hasUnderlyingDisease,
      underlyingDiseaseDetail,
      status,
      departmentId,
      isWalkin
    } = body;

    if (!title || !identificationNumber || !fname || !lname || !date || !time) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    // ตรวจสอบว่ามีการจองที่ยังไม่ถูกยกเลิกอยู่หรือไม่
    const existingAppointment = await db.execute({
      sql: `SELECT identification_number FROM appointments 
            WHERE identification_number = ? AND date = ? AND time = ?
            AND (status IS NULL OR status = 'pending' OR status = 'done')`,
      args: [identificationNumber, date, time],
    });

    if (existingAppointment.rows.length > 0) {
      return NextResponse.json({ error: "คุณมีคิวจองในวันและเวลานี้แล้ว" }, { status: 400 });
    }

    // ตรวจสอบ quota (รับ 6 คน ต่อช่วงเวลา ต่อแผนก) - ไม่นับ walk-in
    const MAX_QUOTA_PER_PERIOD = 6;
    
    // ถ้าเป็น walk-in ไม่ต้องเช็ค quota
    if (!isWalkin) {
      const quotaCheck = await db.execute({
        sql: `SELECT COUNT(*) as booked 
              FROM appointments 
              WHERE departmentId = ? 
                AND date = ? 
                AND time = ?
                AND (status IS NULL OR status = 'pending' OR status = 'done')
                AND (is_walkin IS NULL OR is_walkin = 0)`,
        args: [departmentId, date, time],
      });

      const currentBooked = Number(quotaCheck.rows[0]?.booked ?? 0);
      if (currentBooked >= MAX_QUOTA_PER_PERIOD) {
        return NextResponse.json({ error: "คิวในช่วงเวลานี้เต็มแล้ว กรุณาเลือกช่วงเวลาอื่น" }, { status: 400 });
      }
    }

    const result = await db.execute({
      sql: `INSERT INTO appointments (
              identification_number, time, date, title, fname, lname, phone_number, sex, birthDate,
              is_smoking, is_drinking, has_food_allergy, food_allergy_detail, 
              has_drug_allergy, drug_allergy_detail, has_underlying_disease, underlying_disease_detail, 
              status, departmentId, is_walkin
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        identificationNumber,
        time,
        date,
        title,
        fname,
        lname,
        phoneNumber || "-",
        sex || "-",
        birthDate || null,
        isSmoking ? 1 : 0,
        isDrinking ? 1 : 0,
        hasFoodAllergy ? 1 : 0,
        foodAllergyDetail || "",
        hasDrugAllergy ? 1 : 0,
        drugAllergyDetail || "",
        hasUnderlyingDisease ? 1 : 0,
        underlyingDiseaseDetail || "",
        status || "pending",
        departmentId,
        isWalkin ? 1 : 0
      ],
    });

    // ดึงชื่อแผนก
    const deptResult = await db.execute({
      sql: `SELECT name FROM department WHERE dno = ?`,
      args: [departmentId],
    });
    const deptName = deptResult.rows[0]?.name || "ไม่ระบุ";

    // แปลงวันที่เป็นภาษาไทย
    const dateObj = new Date(date);
    const thaiDate = dateObj.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeLabel = time === "morning" ? "ช่วงเช้า" : "ช่วงบ่าย";

    // สร้าง notification แจ้งผู้ใช้
    try {
      const apId = result.lastInsertRowid;
      
      // ถ้าสถานะเป็น done (คนไข้นอกนัดหมาย/walk-in)
      if (status === "done") {
        await db.execute({
          sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            identificationNumber,
            "ยืนยันนัดหมาย",
            `นัดหมายของคุณแผนก${deptName} วันที่ ${thaiDate} ${timeLabel} ได้รับการยืนยันแล้ว`,
            "appointment",
            apId || null,
          ],
        });

        // เช็คว่าเป็นคิวแรกหรือไม่
        const countResult = await db.execute({
          sql: `SELECT COUNT(*) as cnt FROM appointments 
                WHERE date = ? AND departmentId = ? AND time = ? AND status = 'done' AND ap_id < ?`,
          args: [date, departmentId, time, apId],
        });
        const countBefore = Number((countResult.rows[0] as any)?.cnt || 0);
        const deptLetter = String.fromCharCode(64 + (departmentId || 1));
        const queueCode = `${deptLetter}${String(apId).padStart(2, '0')}`;

        if (countBefore === 0) {
          // คิวแรก
          await db.execute({
            sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
              identificationNumber,
              "🔔 ถึงคิวของคุณแล้ว!",
              `กรุณาเข้าพบแพทย์แผนก${deptName} คิวหมายเลข ${queueCode}`,
              "queue",
              apId,
            ],
          });
        } else if (countBefore === 1) {
          // ลำดับถัดไป
          await db.execute({
            sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
              identificationNumber,
              "🔔 เตรียมตัว! คุณอยู่ลำดับถัดไป",
              `คิว ${queueCode} แผนก${deptName} กรุณาเตรียมตัวรอเรียก`,
              "queue",
              apId,
            ],
          });
        }
      } else {
        // การจองปกติ
        await db.execute({
          sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            identificationNumber,
            "จองคิวสำเร็จ",
            `คุณได้จองคิวแผนก${deptName} วันที่ ${thaiDate} ${timeLabel} กรุณารอการยืนยันจากเจ้าหน้าที่`,
            "booking",
            apId || null,
          ],
        });
      }
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    return NextResponse.json({ success: true, message: "จองคิวสำเร็จ" });

  } catch (error) {
    console.error("Appointment error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการจองคิว", details: String(error) },
      { status: 500 }
    );
  }
}
// Get ดึงรายการแจ้งเตือนของผู้ใช้
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_number = searchParams.get("id_number");
    const all = searchParams.get("all");

    // ถ้าส่ง all=true → ดึงคิวทั้งหมด (pending + done)
    if (all === "true") {
      const data = await db.execute({
        sql: `
          SELECT 
            a.ap_id, a.date, a.time, a.status, a.fname, a.lname, a.title,
            a.identification_number, COALESCE(a.skip_count, 0) as skip_count,
            d.dno, 
            d.name AS department_name 
          FROM appointments a
          LEFT JOIN department d ON a.departmentId = d.dno
          WHERE (a.status IS NULL OR a.status = 'pending' OR a.status = 'done')
          ORDER BY a.date ASC, a.time ASC, COALESCE(a.skip_count, 0) ASC, a.ap_id ASC
        `,
        args: [],
      });
      return NextResponse.json({ success: true, data: data.rows });
    }

    // ถ้าไม่มี id_number → error
    if (!id_number) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    const data = await db.execute({
      sql: `
        SELECT 
          a.*, 
          d.dno, 
          d.name AS department_name 
        FROM appointments a
        LEFT JOIN department d ON a.departmentId = d.dno
        WHERE a.identification_number = ? 
        ORDER BY a.date DESC, a.time DESC
      `,
      args: [id_number],
    });

    return NextResponse.json({ success: true, data: data.rows });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}