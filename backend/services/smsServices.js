// services/smsServices.js
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const sendOtpSms = async (phone, otp) => {
  // Always log OTP in development
  console.log('=================================');
  console.log('📱 SMS TO:', phone);
  console.log('🔑 OTP CODE:', otp);
  console.log('=================================');

  if (!client) {
    console.log('⚠️  Twilio not configured. Using OTP from console.');
    return { success: true, dev_mode: true };
  }

  try {
    const message = await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log('✅ SMS sent successfully:', message.sid);
    return message;
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    // Don't throw error in development
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  DEV MODE: SMS failed but OTP is printed above');
      return { success: true, dev_mode: true };
    }
    throw error;
  }
};