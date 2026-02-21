import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
    try {
        const { ap_id } = await request.json();

        if (!ap_id) {
            return NextResponse.json({ success: false, error: "Missing ap_id" }, { status: 400 });
        }

        const result = await db.execute({
            sql: `UPDATE appointments SET status = 'cancel' WHERE ap_id = ? AND (status = 'pending' OR status IS NULL)`,
            args: [ap_id],
        });

        return NextResponse.json({ success: true, affectedRows: result.rowsAffected });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}