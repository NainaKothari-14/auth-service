import { generateOTP, saveOTP, verifyOTP } from "../services/otpService.js";
import { sendOtpEmail } from "../services/emailService.js";
import { generateAccessToken, generateRefreshToken } from "../services/jwtService.js";

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = generateOTP();
    await saveOTP(email, otp);
    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await verifyOTP(email, otp);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
