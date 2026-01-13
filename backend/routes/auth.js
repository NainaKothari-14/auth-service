//routes/auth.js
import express from "express";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { generateOTP } from "../services/otpService.js";
import { sendOtpEmail } from "../utils/sendEmail.js";
import { sendOtpSms } from "../services/smsServices.js";
import { sendOtpWhatsapp } from "../services/WhatsappServices.js";
import passport from "passport";
import { generateToken } from "../utils/jwt.js";

const router = express.Router();

/**
 * POST /auth/register
 * Body: { username, email, password, phone }
 */

router.post("/register", async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Registeration
    const user = await User.create({
      username,
      email,
      password_hash: password, // Pass plain password, hook will hash it
      phone,
      isVerified: false,
    });

    console.log(`✅ User registered: ${email}`);

    res.json({ 
      message: "Registration successful. Please verify your account.",
      userId: user.id,
      email: user.email,
      requiresVerification: true
    });
  } catch (err) {
    console.error("❌ /register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /auth/send-verification
 * Body: { email, method: 'email' | 'whatsapp' }
 */

router.post("/send-verification", async (req, res) => {
  const { email, method } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await OTP.update(
      { used: true },
      { where: { userId: user.id, used: false } }
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({ otpCode: otp, expiresAt, userId: user.id });

    if (method === 'whatsapp' && user.phone) {
      try {
        await sendOtpWhatsapp(user.phone, otp);
        console.log(`✅ WhatsApp OTP sent to ${user.phone}`);
        return res.json({ message: "OTP sent to your WhatsApp" });
      } catch (whatsappErr) {
        console.warn("⚠️ WhatsApp failed, falling back to email");
      }
    }
    
    await sendOtpEmail(email, otp);
    console.log(`✅ Email OTP sent to ${email}`);
    res.json({ message: "OTP sent to your email" });
    
  } catch (err) {
    console.error("❌ /send-verification error:", err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

/**
 * POST /auth/verify-account
 * Body: { email, otp }
 */

router.post("/verify-account", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otpRecord = await OTP.findOne({
      where: {
        userId: user.id,
        otpCode: otp,
        used: false,
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or already used OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    await otpRecord.update({ used: true });
    await user.update({ isVerified: true });

    const token = generateToken(user);

    console.log(`✅ Account verified: ${email}`);

    res.json({ 
      token, 
      message: "Account verified successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error("❌ /verify-account error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/**
 * POST /auth/login
 * Body: { email, password }
 */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        error: "Please verify your account first",
        requiresVerification: true
      });
    }

    if (!user.password_hash) {
      return res.status(400).json({ 
        error: "This account uses OAuth. Please login with Google or GitHub." 
      });
    }

    // Use the model's comparePassword method
    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    console.log(`✅ User logged in: ${email}`);

    res.json({ 
      token, 
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    console.error("❌ /login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /auth/forgot-password
 * Body: { email, method: 'email' | 'whatsapp' }
 */

router.post("/forgot-password", async (req, res) => {
  const { email, method } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ 
        message: "If an account exists, you will receive a password reset code." 
      });
    }

    await OTP.update(
      { used: true },
      { where: { userId: user.id, used: false } }
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({ otpCode: otp, expiresAt, userId: user.id });

    if (method === 'whatsapp' && user.phone) {
      try {
        await sendOtpWhatsapp(user.phone, otp);
        console.log(`WhatsApp password reset sent to ${user.phone}`);
      } catch (whatsappErr) {
        console.warn("WhatsApp failed, sending email instead");
        await sendOtpEmail(email, otp);
        console.log(`Email password reset sent to ${email}`);
      }
    } else {
      await sendOtpEmail(email, otp);
      console.log(`Email password reset sent to ${email}`);
    }

    res.json({ 
      message: "If an account exists, you will receive a password reset code." 
    });
  } catch (err) {
    console.error("❌ /forgot-password error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

/**
 * POST /auth/reset-password
 * Body: { email, otp, newPassword }
 */

router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, OTP, and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otpRecord = await OTP.findOne({
      where: {
        userId: user.id,
        otpCode: otp,
        used: false,
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or already used OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    await otpRecord.update({ used: true });

    console.log(`🔐 Resetting password for: ${email}`);
    
    // DON'T hash here - let the beforeUpdate hook do it
    user.password_hash = newPassword; // Pass plain password
    await user.save();
    
    // Reload to get the hashed version
    await user.reload();

    console.log(`✅ Password hash saved to DB`);

    // Test the new password
    const testResult = await user.comparePassword(newPassword);
    console.log(`   Verification test: ${testResult ? '✅ PASS' : '❌ FAIL'}`);

    if (!testResult) {
      console.error('❌ CRITICAL: Password verification failed after reset!');
      return res.status(500).json({ 
        error: "Password reset failed. Please try again." 
      });
    }

    console.log(`✅ Password reset successful: ${email}`);

    res.json({ 
      message: "Password reset successful. You can now login with your new password." 
    });
  } catch (err) {
    console.error("❌ /reset-password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});



/* ---------------- Social OAuth ---------------- */

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=oauth_failed`);
      }

      if (!req.user.isVerified) {
        await req.user.update({ isVerified: true });
      }
      
      const token = generateToken(req.user);
      console.log(`✅ Google OAuth successful: ${req.user.email}`);
      
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success?token=${token}`);
    } catch (err) {
      console.error("❌ Google OAuth callback error:", err);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=oauth_failed`);
    }
  }
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=oauth_user_not_found`
        );
      }

      if (!req.user.isVerified) {
        await req.user.update({ isVerified: true });
      }

      const token = generateToken(req.user);
      console.log(`✅ GitHub OAuth successful: ${req.user.email}`);

      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success?token=${token}`
      );
    } catch (err) {
      console.error("❌ GitHub OAuth callback error:", err);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=oauth_failed`
      );
    }
  }
);

export default router;