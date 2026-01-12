import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment");
}

// In-memory session store (use Redis in production)
const ssoSessions = new Map();

// Clean up expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of ssoSessions.entries()) {
    if (now - session.createdAt > 24 * 60 * 60 * 1000) { // 24 hours
      ssoSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

// Validate redirect URL
const isValidRedirect = (url) => {
  try {
    const parsed = new URL(url);
    const allowed = process.env.ALLOWED_REDIRECT_DOMAINS?.split(',') || ['localhost'];
    return allowed.some(domain => parsed.hostname.includes(domain));
  } catch {
    return false;
  }
};

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "SSO routes working" });
});

// GET /sso/login - Check for existing session first
router.get("/login", (req, res) => {
  const { redirect } = req.query;

  if (!redirect || !isValidRedirect(redirect)) {
    return res.status(400).send("Invalid redirect URL");
  }

  // Check for existing SSO session
  const sessionId = req.cookies?.sso_session;
  if (sessionId && ssoSessions.has(sessionId)) {
    const session = ssoSessions.get(sessionId);
    
    // Auto-issue token
    const token = jwt.sign(
      { id: session.userId, email: session.email, username: session.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const redirectUrl = `${redirect}?token=${token}`;
    console.log('✅ SSO auto-login for:', session.email);
    return res.redirect(redirectUrl);
  }

  const safeRedirect = redirect.replace(/"/g, '&quot;');
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SSO Login</title>
      <style>
        body { font-family: Arial; max-width: 400px; margin: 100px auto; padding: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
        button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <h2>SSO Login</h2>
      <form method="POST" action="/sso/login">
        <input type="hidden" name="redirect" value="${safeRedirect}" />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </body>
    </html>
  `);
});

// POST /sso/login
router.post("/login", async (req, res) => {
  console.log("POST /sso/login - Body:", req.body);
  
  try {
    const { email, password, redirect } = req.body;

    if (!email || !password || !redirect) {
      console.log("Missing fields:", { email: !!email, password: !!password, redirect: !!redirect });
      return res.status(400).send("Missing required fields");
    }

    if (!isValidRedirect(redirect)) {
      console.log("Invalid redirect:", redirect);
      return res.status(400).send("Invalid redirect URL");
    }

    console.log("Looking up user:", email);
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log("User not found");
      return res.status(401).send("Invalid credentials");
    }

    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).send("Invalid credentials");
    }

    if (!user.isVerified) {
      console.log("User not verified");
      return res.status(403).send("Email not verified");
    }

    // Create SSO session
    const sessionId = crypto.randomBytes(32).toString('hex');
    ssoSessions.set(sessionId, {
      userId: user.id,
      email: user.email,
      username: user.username,
      createdAt: Date.now(),
    });

    // Set secure cookie
    res.cookie('sso_session', sessionId, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const redirectUrl = `${redirect}?token=${token}`;
    console.log("✅ SSO login successful for:", email);
    console.log("Redirecting to:", redirectUrl);
    
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login failed: " + err.message);
  }
});

// GET /sso/verify
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ valid: false, error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isVerified) {
      return res.status(401).json({ valid: false, error: "Invalid user" });
    }

    res.json({ 
      valid: true, 
      user: { 
        id: decoded.id, 
        email: decoded.email,
        username: decoded.username 
      }
    });
  } catch (err) {
    res.status(401).json({ 
      valid: false, 
      error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }
});

// GET /sso/logout - Clear SSO session
router.get("/logout", (req, res) => {
  const sessionId = req.cookies?.sso_session;
  if (sessionId) {
    ssoSessions.delete(sessionId);
    res.clearCookie('sso_session');
  }
  res.json({ message: "Logged out successfully" });
});

export default router;