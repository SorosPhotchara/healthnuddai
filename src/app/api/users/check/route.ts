import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // ดึงเลขบัตรจาก URL เช่น /api/users/check?id=1234567890123
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id || id.length !== 13) {
            return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        }

        // ค้นหาในตาราง users ตามเลขบัตรประชาชน
        const result = await db.execute({
            sql: `SELECT title, fname, lname, phone_number, sex, birth_date 
            FROM users 
            WHERE identification_number = ? LIMIT 1`,
            args: [id],
        });

        if (result.rows.length > 0) {
            // ส่งข้อมูลกลับไปถ้าเจอ
            return NextResponse.json({ success: true, user: result.rows[0] });
        } else {
            return NextResponse.json({ success: false, message: "ไม่พบข้อมูล" }, { status: 404 });
        }
    } catch (error) {
        console.error("Check user error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" }, { status: 500 });
    }
}