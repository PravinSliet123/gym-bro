import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Member } from "@/models/Member"
import { Gym } from "@/models/Gym"

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

        const now = new Date()
        const fiveDays = new Date()
        fiveDays.setDate(fiveDays.getDate() + 5)
        const tenDays = new Date()
        tenDays.setDate(tenDays.getDate() + 10)

        // Find members expiring in 5 days
        const expiringIn5 = await Member.find({
            isDeleted: false,
            planEndDate: { $gte: now, $lte: fiveDays },
        }).populate("gymId", "name ownerEmail")

        // Find members expiring in 10 days
        const expiringIn10 = await Member.find({
            isDeleted: false,
            planEndDate: { $gte: fiveDays, $lte: tenDays },
        }).populate("gymId", "name ownerEmail")

        return NextResponse.json({
            success: true,
            data: {
                expiringIn5Days: expiringIn5.length,
                expiringIn10Days: expiringIn10.length,
                message: "Expiry check completed",
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
