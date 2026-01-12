import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment");
}

// Validate redirect URL to prevent open redirects
const isValidRedirect = (url) => {
  try {
    const parsed = new URL(url);
    const allowed = process.env.ALLOWED_REDIRECT_DOMAINS?.split(',') || [];
    return allowed.some(domain => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
};

/**
 * GET /sso/login
 */
router.get("/login", (req, res) => {
  const { redirect } = req.query;

  if (!redirect || !isValidRedirect(redirect)) {
    return res.status(400).send("Invalid or missing redirect URL");
  }

  // Prevent XSS by properly escaping
  const safeRedirect = redirect.replace(/"/g, '&quot;');
  
  res.send(`
    <h2>SSO Login</h2>
    <form method="POST" action="/sso/login">
      <input type="hidden" name="redirect" value="${safeRedirect}" />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  `);
});

/**
 * POST /sso/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, redirect } = req.body;

    if (!email || !password || !redirect) {
      return res.status(400).send("Missing required fields");
    }

    if (!isValidRedirect(redirect)) {
      return res.status(400).send("Invalid redirect URL");
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send("Invalid credentials");
    }

    if (!user.isVerified) {
      return res.status(403).send("Email not verified");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.redirect(`${redirect}?token=${token}`);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login failed");
  }
});

/**
 * GET /sso/verify
 */
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ valid: false, error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Optionally verify user still exists
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isVerified) {
      return res.status(401).json({ valid: false, error: "Invalid user" });
    }

    res.json({ 
      valid: true, 
      user: { id: decoded.id, email: decoded.email }
    });
  } catch (err) {
    res.status(401).json({ 
      valid: false, 
      error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }
});

export default router;
