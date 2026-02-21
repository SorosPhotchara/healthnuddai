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
      departmentId
    } = body;

    if (!title || !identificationNumber || !fname || !lname || !date || !time) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const existingAppointment = await db.execute({
      sql: `SELECT identification_number FROM appointments 
            WHERE identification_number = ? AND date = ? AND time = ?`,
      args: [identificationNumber, date, time],
    });

    if (existingAppointment.rows.length > 0) {
      return NextResponse.json({ error: "คุณมีคิวจองในวันและเวลานี้แล้ว" }, { status: 400 });
    }


    await db.execute({
      sql: `INSERT INTO appointments (
              identification_number, time, date, title, fname, lname, phone_number, sex, birthDate,
              is_smoking, is_drinking, has_food_allergy, food_allergy_detail, 
              has_drug_allergy, drug_allergy_detail, has_underlying_disease, underlying_disease_detail, 
              status, departmentId
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        identificationNumber,
        time,
        date,
        title,
        fname,
        lname,
        phoneNumber,
        sex,
        birthDate,
        isSmoking ? 1 : 0,
        isDrinking ? 1 : 0,
        hasFoodAllergy ? 1 : 0,
        foodAllergyDetail || "",
        hasDrugAllergy ? 1 : 0,
        drugAllergyDetail || "",
        hasUnderlyingDisease ? 1 : 0,
        underlyingDiseaseDetail || "",
        status || "pending",
        departmentId
      ],
    });

    return NextResponse.json({ success: true, message: "จองคิวสำเร็จ" });

  } catch (error) {
    console.error("Appointment error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการจองคิว", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_number = searchParams.get("id_number");

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