import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ap_id } = body;

    if (!ap_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ ap_id" },
        { status: 400 }
      );
    }

    // เพิ่ม skip_count +1 (ถ้าไม่มี column จะ default เป็น 0)
    await db.execute({
      sql: `UPDATE appointments SET skip_count = COALESCE(skip_count, 0) + 1 WHERE ap_id = ?`,
      args: [ap_id],
    });

    return NextResponse.json({
      success: true,
      message: "ข้ามคิวสำเร็จ",
    });
  } catch (error) {
    console.error("Skip error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการข้ามคิว" },
      { status: 500 }
    );
  }
}
