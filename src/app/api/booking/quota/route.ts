import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// จำนวนคิวสูงสุดต่อแผนก ต่อช่วงเวลา
const MAX_QUOTA_PER_PERIOD = 6;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const date = searchParams.get("date");
    const period = searchParams.get("period"); // morning, afternoon หรือไม่ระบุ

    if (!departmentId || !date) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ departmentId และ date" },
        { status: 400 }
      );
    }

    // ถ้าระบุช่วงเวลา → นับเฉพาะช่วงเวลานั้น (ไม่นับ walk-in)
    if (period) {
      const result = await db.execute({
        sql: `
          SELECT COUNT(*) as booked 
          FROM appointments 
          WHERE departmentId = ? 
            AND date = ? 
            AND time = ?
            AND (status IS NULL OR status = 'pending' OR status = 'done')
            AND (is_walkin IS NULL OR is_walkin = 0)
        `,
        args: [departmentId, date, period],
      });

      const booked = Number(result.rows[0]?.booked ?? 0);

      return NextResponse.json({
        success: true,
        data: {
          departmentId: Number(departmentId),
          date,
          period,
          max: MAX_QUOTA_PER_PERIOD,
          booked,
          remaining: MAX_QUOTA_PER_PERIOD - booked,
        },
      });
    }

    // ถ้าไม่ระบุช่วงเวลา → คืนทั้ง morning และ afternoon (ไม่นับ walk-in)
    const morningResult = await db.execute({
      sql: `
        SELECT COUNT(*) as booked 
        FROM appointments 
        WHERE departmentId = ? 
          AND date = ? 
          AND time = 'morning'
          AND (status IS NULL OR status = 'pending' OR status = 'done')
          AND (is_walkin IS NULL OR is_walkin = 0)
      `,
      args: [departmentId, date],
    });

    const afternoonResult = await db.execute({
      sql: `
        SELECT COUNT(*) as booked 
        FROM appointments 
        WHERE departmentId = ? 
          AND date = ? 
          AND time = 'afternoon'
          AND (status IS NULL OR status = 'pending' OR status = 'done')
          AND (is_walkin IS NULL OR is_walkin = 0)
      `,
      args: [departmentId, date],
    });

    const morningBooked = Number(morningResult.rows[0]?.booked ?? 0);
    const afternoonBooked = Number(afternoonResult.rows[0]?.booked ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        departmentId: Number(departmentId),
        date,
        morning: {
          max: MAX_QUOTA_PER_PERIOD,
          booked: morningBooked,
          remaining: MAX_QUOTA_PER_PERIOD - morningBooked,
        },
        afternoon: {
          max: MAX_QUOTA_PER_PERIOD,
          booked: afternoonBooked,
          remaining: MAX_QUOTA_PER_PERIOD - afternoonBooked,
        },
      },
    });
  } catch (error) {
    console.error("Quota check error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบคิว", details: String(error) },
      { status: 500 }
    );
  }
}
