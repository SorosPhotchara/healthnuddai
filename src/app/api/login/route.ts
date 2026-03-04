import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ค้นหา user จาก email
    const result = await db.execute({
      sql: `SELECT identification_number, email, password, fname, lname, role, dno FROM users WHERE email = ?`,
      args: [email],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบอีเมลนี้ในระบบ" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // ตรวจสอบรหัสผ่าน (ยังไม่ได้ hash)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        identification_number: user.identification_number,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        role: user.role,
        dno: user.dno,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
