// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email provided by Google"), null);
        }

        let user = await User.findOne({ where: { email } });

        if (user) {
          // Update Google ID if not set
          if (!user.googleId) {
            await user.update({ googleId: profile.id });
          }
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          username: profile.displayName || email.split("@")[0],
          email: email,
          googleId: profile.id,
          isVerified: true,
          password_hash: null, // OAuth users don't have passwords
        });

        console.log(`✅ New user created via Google: ${email}`);
        return done(null, user);
      } catch (err) {
        console.error("❌ Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"], // Request email access
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 GitHub profile received:", {
          id: profile.id,
          username: profile.username,
          emails: profile.emails
        });

        // GitHub email might be in different formats
        let email = null;

        // Try to get primary verified email
        if (profile.emails && profile.emails.length > 0) {
          // Find primary email
          const primaryEmail = profile.emails.find(e => e.primary && e.verified);
          // Or any verified email
          const verifiedEmail = profile.emails.find(e => e.verified);
          // Or just the first email
          email = primaryEmail?.value || verifiedEmail?.value || profile.emails[0]?.value;
        }

        // If still no email, try to fetch from GitHub API
        if (!email && accessToken) {
          try {
            const response = await fetch('https://api.github.com/user/emails', {
              headers: {
                'Authorization': `token ${accessToken}`,
                'User-Agent': 'Auth-Service'
              }
            });
            const emails = await response.json();
            console.log("📧 Fetched emails from GitHub API:", emails);
            
            if (emails && emails.length > 0) {
              const primaryEmail = emails.find(e => e.primary && e.verified);
              const verifiedEmail = emails.find(e => e.verified);
              email = primaryEmail?.email || verifiedEmail?.email || emails[0]?.email;
            }
          } catch (fetchErr) {
            console.error("❌ Failed to fetch emails from GitHub API:", fetchErr);
          }
        }

        // Last resort: create email from GitHub username
        if (!email) {
          console.warn("⚠️ No email from GitHub, using username fallback");
          email = `${profile.username}@github-oauth.local`;
        }

        console.log(`✅ Using email: ${email}`);

        // Check if user exists by GitHub ID
        let user = await User.findOne({ where: { githubId: profile.id } });

        if (user) {
          console.log(`✅ Existing user found via GitHub ID: ${email}`);
          // Update email if it was a fallback before
          if (user.email.includes('@github-oauth.local') && !email.includes('@github-oauth.local')) {
            await user.update({ email: email });
            console.log(`✅ Updated email from fallback to real email: ${email}`);
          }
          return done(null, user);
        }

        // Check if user exists by email
        user = await User.findOne({ where: { email } });

        if (user) {
          console.log(`✅ Existing user found via email: ${email}`);
          // Link GitHub account
          if (!user.githubId) {
            await user.update({ githubId: profile.id });
            console.log(`✅ Linked GitHub account to existing user`);
          }
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          username: profile.username || profile.displayName || email.split("@")[0],
          email: email,
          githubId: profile.id,
          isVerified: true,
          password_hash: null, // OAuth users don't have passwords
        });

        console.log(`✅ New user created via GitHub: ${email}`);
        return done(null, user);
      } catch (err) {
        console.error("❌ GitHub OAuth error:", err);
        return done(err, null);
      }
    }
  )
);

// Serialize user for session (not used in JWT, but required by passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;