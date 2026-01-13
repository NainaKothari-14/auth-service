import OTP from "../models/OTP.js";
import User from "../models/User.js";
//generate otp
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const saveOTP = async (email, otp, expiryMinutes = 5) => {
  let user = await User.findOne({ where: { email } });

  if (!user) {
    user = await User.create({ email });
  }

  return OTP.create({
    userId: user.id,
    otpCode: otp,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
  });
};

//to verify otp
export const verifyOTP = async (email, otp) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  const record = await OTP.findOne({
    where: {
      userId: user.id,
      otpCode: otp,
      used: false,
    },
    order: [["createdAt", "DESC"]],
  });

  if (!record) throw new Error("Invalid OTP");
  if (record.expiresAt < new Date()) throw new Error("OTP expired");

  record.used = true;
  await record.save();

  return user;
};
