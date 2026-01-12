import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is missing in .env file");
}

if (!process.env.EMAIL_FROM) {
  throw new Error("EMAIL_FROM is missing in .env file");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (to, otp, expiryMinutes = 5) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: "Your Login OTP - Auth Service",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          background-color: #f9fafb;
          padding: 24px;
        ">
          <div style="
            max-width: 420px;
            margin: auto;
            background: #ffffff;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          ">
            <h2 style="color:#111827;">Auth Service</h2>
            <p style="color:#374151;">
              Use the following One-Time Password (OTP) to sign in:
            </p>

            <div style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 6px;
              text-align: center;
              margin: 20px 0;
              color: #2563eb;
            ">
              ${otp}
            </div>

            <p style="color:#374151;">
              This code will expire in <b>${expiryMinutes} minutes</b>.
            </p>

            <hr style="margin: 20px 0;" />

            <p style="font-size: 12px; color:#6b7280;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully via Resend:', data);
    return data;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};