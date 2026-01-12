// services/WhatsappServices.js
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'

if (!accountSid || !authToken || !whatsappFrom) {
  throw new Error('Twilio credentials missing in .env');
}

const client = twilio(accountSid, authToken);

export const sendOtpWhatsapp = async (phone, otp) => {
  try {
    // Ensure phone has country code and whatsapp: prefix
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const whatsappTo = `whatsapp:${formattedPhone}`;

    const message = await client.messages.create({
      from: whatsappFrom,
      to: whatsappTo,
      body: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this, please ignore this message.`
    });

    console.log(`✅ WhatsApp OTP sent: ${message.sid} to: ${whatsappTo}`);
    return message;
  } catch (error) {
    console.error('❌ WhatsApp sending failed:', error.message);
    throw error;
  }
};