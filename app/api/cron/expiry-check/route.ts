import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { processAutomatedReminders } from "@/actions/notification"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        // Verify cron secret (optional security)
        const { searchParams } = new URL(request.url)
        const secret = searchParams.get("secret")
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const result = await processAutomatedReminders()

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: result.message,
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
