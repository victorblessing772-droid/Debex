import axios from 'axios';

const AFRICASTALKING_URL = 'https://api.africastalking.com/version1/messaging/bulk';
const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;

/**
 * Normalize phone number to Kenya format (+254)
 * @param {string} phoneNumber - Phone number to normalize
 * @returns {string} Normalized phone number
 */
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;

  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  // If doesn't start with 254, add it
  else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  // Add + prefix if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

/**
 * Send SMS using Africa's Talking API
 * @param {string|string[]} phoneNumbers - Phone number(s) to send SMS to
 * @param {string} message - Message content
 * @param {string} senderId - Sender ID (optional, defaults to 'Debex')
 * @returns {Promise<{success: boolean, messageId: string, statusCode: number, response: any}>}
 */
export const sendSMS = async (phoneNumbers, message, senderId = 'Debex') => {
  try {
    // Validate inputs
    if (!phoneNumbers || !message) {
      console.error('[SMS Service] Missing required parameters');
      return {
        success: false,
        statusCode: 400,
        error: 'Phone number and message are required',
        response: null,
      };
    }

    if (!AT_USERNAME || !AT_API_KEY) {
      console.error('[SMS Service] Missing Africa\'s Talking credentials in environment variables');
      return {
        success: false,
        statusCode: 500,
        error: 'Africa\'s Talking API credentials not configured',
        response: null,
      };
    }

    // Ensure phoneNumbers is an array
    const phoneArray = Array.isArray(phoneNumbers)
      ? phoneNumbers.map(normalizePhoneNumber).filter(Boolean)
      : [normalizePhoneNumber(phoneNumbers)];

    if (phoneArray.length === 0) {
      console.error('[SMS Service] No valid phone numbers provided');
      return {
        success: false,
        statusCode: 400,
        error: 'No valid phone numbers provided',
        response: null,
      };
    }

    console.log(`[SMS Service] Sending SMS to ${phoneArray.length} recipient(s)...`);
    console.log(`[SMS Service] Recipients:`, phoneArray);
    console.log(`[SMS Service] Message: "${message}"`);

    // Prepare request body
    const requestBody = {
      username: AT_USERNAME,
      phoneNumbers: phoneArray,
      message: message,
      senderId: senderId,
      enqueue: 1,
    };

    // Send request to Africa's Talking API
    const response = await axios.post(AFRICASTALKING_URL, requestBody, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        apiKey: AT_API_KEY,
      },
    });

    console.log('[SMS Service] API Response:', JSON.stringify(response.data, null, 2));

    // Check response status
    if (response.status === 200 && response.data) {
      const { SMSMessageData } = response.data;
      const { Recipients, Message } = SMSMessageData || {};

      if (Recipients && Recipients.length > 0) {
        const firstRecipient = Recipients[0];
        const messageId = firstRecipient.messageId || 'N/A';

        console.log(`[SMS Service] SMS sent successfully to ${Recipients.length} recipient(s)`);
        console.log(`[SMS Service] Message ID: ${messageId}`);

        return {
          success: true,
          statusCode: 200,
          messageId: messageId,
          response: response.data,
          recipientCount: Recipients.length,
        };
      }
    }

    console.warn('[SMS Service] Unexpected response format:', response.data);
    return {
      success: false,
      statusCode: response.status,
      error: 'Unexpected API response',
      response: response.data,
    };
  } catch (error) {
    // Log detailed error information
    console.error('[SMS Service] Error sending SMS:');
    console.error('  Error Type:', error.constructor.name);
    console.error('  Status Code:', error.response?.status);
    console.error('  API Response:', error.response?.data);
    console.error('  Message:', error.message);

    const statusCode = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Failed to send SMS';

    return {
      success: false,
      statusCode: statusCode,
      error: errorMessage,
      response: error.response?.data || null,
    };
  }
};

/**
 * Send SMS with automatic retry logic
 * @param {string|string[]} phoneNumbers - Phone number(s)
 * @param {string} message - Message content
 * @param {string} senderId - Sender ID
 * @param {number} retries - Number of retries
 * @returns {Promise<{success: boolean, messageId: string, statusCode: number, response: any}>}
 */
export const sendSMSWithRetry = async (phoneNumbers, message, senderId = 'Debex', retries = 2) => {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[SMS Service] Attempt ${attempt}/${retries} to send SMS...`);
      const result = await sendSMS(phoneNumbers, message, senderId);

      if (result.success) {
        return result;
      }

      lastError = result;

      // Wait before retry (exponential backoff: 1s, 2s, etc.)
      if (attempt < retries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`[SMS Service] Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      lastError = {
        success: false,
        statusCode: 500,
        error: error.message,
        response: null,
      };
    }
  }

  console.error(`[SMS Service] Failed to send SMS after ${retries} attempts`);
  return lastError;
};

export default { sendSMS, sendSMSWithRetry, normalizePhoneNumber };
