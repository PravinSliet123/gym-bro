import nodemailer from "nodemailer";

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};

const transporter = nodemailer.createTransport(smtpConfig);

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Gym Bro" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error("Email Error:", error);
        return { success: false, error: error.message };
    }
}
