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

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        console.log(`Attempting to send WhatsApp message to ${cleanNumber}...`);
        const response = await fetch(
            `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
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
                signal: controller.signal,
            }
        );

        clearTimeout(id);
        const data = await response.json();

        if (response.ok) {
            console.log("WhatsApp message sent successfully");
            return { success: true, messageId: data.messages?.[0]?.id };
        } else {
            console.error("WhatsApp API Error:", JSON.stringify(data, null, 2));
            return { success: false, error: data.error?.message || "Unknown error" };
        }
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === "AbortError") {
            console.error("WhatsApp Request Timed Out (15s)");
            return { success: false, error: "Connection timed out. Please check your internet or firewall." };
        }
        console.error("WhatsApp Network Error:", error);
        return { success: false, error: error.message };
    }
}
