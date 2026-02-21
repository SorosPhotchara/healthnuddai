// app/api/booking/update/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
    try {
        const { ap_id, status } = await request.json();

        await db.execute({
            sql: `UPDATE appointments SET status = ? WHERE ap_id = ?`,
            args: [status, ap_id],
        });


        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}