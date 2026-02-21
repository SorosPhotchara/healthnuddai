import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
    try {

        const result = await db.execute({
            sql: "SELECT dno, name FROM department ORDER BY dno ASC",
            args: [],
        });

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Database error in /api/departments:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch departments",
            },
            { status: 500 }
        );
    }
}