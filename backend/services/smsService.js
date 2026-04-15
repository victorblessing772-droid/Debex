import axios from "axios";

const AFRICASTALKING_URL =
  "https://api.africastalking.com/version1/messaging/bulk";

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;

/**
 * Normalize phone number to +254 format
 */
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;

  let cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }

  return "+" + cleaned;
};

/**
 * Send SMS
 */
export const sendSMS = async (phoneNumbers, message, senderId = "Debex") => {
  try {
    if (!AT_USERNAME || !AT_API_KEY) {
      throw new Error("Missing Africa's Talking credentials in .env");
    }

    const phones = Array.isArray(phoneNumbers)
      ? phoneNumbers.map(normalizePhoneNumber)
      : [normalizePhoneNumber(phoneNumbers)];

    const requestBody = {
      username: AT_USERNAME,
      phoneNumbers: phones,
      message,
      senderId,
      enqueue: 1,
    };

    console.log("📤 Sending SMS:", requestBody);

    const response = await axios.post(AFRICASTALKING_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        apiKey: AT_API_KEY,
      },
    });

    console.log("📥 SMS RESPONSE:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ SMS ERROR:", error.response?.data || error.message);

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};