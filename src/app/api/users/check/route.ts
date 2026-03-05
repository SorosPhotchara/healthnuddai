import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id || id.length !== 13) {
            return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        }

        // 🐧 Add avatar_url to your SELECT statement
        const result = await db.execute({
            sql: `SELECT title, fname, lname, phone_number, sex, birth_date, avatar_url 
            FROM users 
            WHERE identification_number = ? LIMIT 1`,
            args: [id],
        });

        if (result.rows.length > 0) {
            const user = result.rows[0];


            let base64Image = null;
            if (user.avatar_url) {

                const buffer = Buffer.from(user.avatar_url as Uint8Array);
                base64Image = `data:image/png;base64,${buffer.toString("base64")}`;
            }

            return NextResponse.json({
                success: true,
                user: {
                    ...user,
                    avatar_url: base64Image
                }
            });
        } else {
            return NextResponse.json({ success: false, message: "ไม่พบข้อมูล" }, { status: 404 });
        }
    } catch (error) {
        console.error("Check user error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" }, { status: 500 });
    }
}