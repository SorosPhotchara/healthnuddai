import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { identification_number, phone_number, password } = body;

        if (!identification_number) {
            return NextResponse.json({ error: "Missing ID number" }, { status: 400 });
        }

        const updates: string[] = [];
        const args: any[] = [];


        if (phone_number && phone_number.trim() !== "") {
            updates.push("phone_number = ?");
            args.push(phone_number);
        }


        if (password && password.trim() !== "") {
            updates.push("password = ?");
            args.push(password);
        }

        if (updates.length === 0) {
            return NextResponse.json({ message: "Nothing to update" }, { status: 200 });
        }

        const sql = `UPDATE users SET ${updates.join(", ")} WHERE identification_number = ?`;

        args.push(identification_number);

        await db.execute({
            sql: sql,
            args: args,
        });

        return NextResponse.json({ success: true, message: "Profile updated successfully! ✅" });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}