const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function sendWhatsAppMessage({
    to,
    message,
}: {
    to: string;
    message: string;
}) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        return { success: false, error: "WhatsApp API not configured" };
    }

    // Clean phone number (remove +, spaces, etc.) and add 91 if missing (standard for India, adjust if needed)
    let cleanNumber = to.replace(/\D/g, "");
    if (cleanNumber.length === 10) cleanNumber = "91" + cleanNumber;

    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: cleanNumber,
                    type: "text",
                    text: {
                        body: message,
                    },
                }),
            }
        );

        const data = await response.json();

        if (response.ok) {
            return { success: true, messageId: data.messages?.[0]?.id };
        } else {
            console.error("WhatsApp API Error:", data);
            return { success: false, error: data.error?.message || "Unknown error" };
        }
    } catch (error: any) {
        console.error("WhatsApp Network Error:", error);
        return { success: false, error: error.message };
    }
}
