import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
    try {
        // 🐧 Switch to formData to handle both text and files
        const formData = await req.formData();

        const identification_number = formData.get("identification_number") as string;
        const phone_number = formData.get("phone_number") as string;
        const password = formData.get("password") as string;
        const avatarFile = formData.get("avatar") as File | null;

        if (!identification_number) {
            return NextResponse.json({ error: "Missing ID number" }, { status: 400 });
        }

        const updates: string[] = [];
        const args: any[] = [];

        // --- 1. Image Logic (Turso BLOB) ---
        if (avatarFile && avatarFile.size > 0) {
            const arrayBuffer = await avatarFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            updates.push("avatar_url = ?"); // Ensure this column exists in Turso
            args.push(buffer);
        }

        // --- 2. Text Logic (Phone & Password) ---
        if (phone_number && phone_number.trim() !== "") {
            updates.push("phone_number = ?");
            args.push(phone_number);
        }

        if (password && password.trim() !== "") {
            updates.push("password = ?");
            args.push(password);
        }

        // Check if there is actually anything to save
        if (updates.length === 0) {
            return NextResponse.json({ message: "Nothing to update" }, { status: 200 });
        }

        const sql = `UPDATE users SET ${updates.join(", ")} WHERE identification_number = ?`;
        args.push(identification_number);

        // Execute the update in your Turso database
        await db.execute({
            sql: sql,
            args: args,
        });

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully! ✅"
        });

    } catch (error) {
        // Log the error for your terminal debugging
        console.error("Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}